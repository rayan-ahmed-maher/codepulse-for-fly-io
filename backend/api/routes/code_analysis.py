import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from openai import OpenAI
import httpx

from core.config import settings
from core.supabase_client import db

router = APIRouter(prefix="/analysis", tags=["Code Analysis"])
logger = logging.getLogger(__name__)

# ── Pydantic Models ──────────────────────────────────────────────────────────

class PathInput(BaseModel):
    project_path: str

class CompareInput(BaseModel):
    project_id_1: str
    project_id_2: str

class ExportInput(BaseModel):
    project_id: str
    email: str

# ── Helper for NVIDIA NIM ───────────────────────────────────────────────────

def get_nvidia_client() -> Optional[OpenAI]:
    if not settings.has_nvidia:
        return None
    try:
        return OpenAI(
            base_url=settings.NVIDIA_BASE_URL,
            api_key=settings.NVIDIA_API_KEY,
        )
    except Exception as e:
        logger.error(f"NVIDIA client init failed: {e}")
        return None

def read_project_files(project_path: str, max_files: int = 15, max_chars: int = 20000) -> str:
    """Read a subset of project files to send to AI for review."""
    if not os.path.isdir(project_path):
        return ""
    
    code_content = []
    total_chars = 0
    file_count = 0
    
    for root, _, files in os.walk(project_path):
        if "node_modules" in root or ".venv" in root or ".git" in root or "__pycache__" in root:
            continue
            
        for file in files:
            if not file.endswith(('.py', '.js', '.jsx', '.ts', '.tsx', '.json')):
                continue
            
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                rel_path = os.path.relpath(filepath, project_path)
                block = f"--- {rel_path} ---\n{content}\n"
                
                if total_chars + len(block) > max_chars:
                    break
                
                code_content.append(block)
                total_chars += len(block)
                file_count += 1
                
                if file_count >= max_files:
                    break
            except Exception:
                continue
        if file_count >= max_files or total_chars >= max_chars:
            break
            
    return "\n".join(code_content)

# ── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/ai-review")
async def ai_review(data: PathInput):
    """Use NVIDIA NIM to review code and suggest actionable improvements."""
    path = data.project_path
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Invalid project path")
    
    client = get_nvidia_client()
    if not client:
        return {"status": "error", "message": "NVIDIA API not configured"}
        
    code_context = read_project_files(path)
    if not code_context:
        return {"status": "success", "improvements": []}
        
    prompt = (
        "Review this code and give specific actionable improvements. "
        "Return a raw JSON array containing objects with these exact keys: "
        "file_name, line_number, issue, suggestion, severity (low, medium, high). "
        "Do not use markdown formatting like ```json in your response. Just the raw JSON array.\n\n"
        f"{code_context}"
    )
    
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2048,
        )
        reply = response.choices[0].message.content.strip()
        
        # Clean up possible markdown code blocks from the response
        if reply.startswith("```json"):
            reply = reply.replace("```json", "", 1).strip()
        if reply.endswith("```"):
            reply = reply[:-3].strip()
            
        improvements = json.loads(reply)
        return {"status": "success", "improvements": improvements}
    except Exception as e:
        logger.error(f"AI Review failed: {e}")
        return {"status": "error", "message": str(e), "improvements": []}

@router.post("/security-scan")
async def security_scan(data: PathInput):
    """Scan code for hardcoded secrets, SQL injection risks, and eval usage."""
    path = data.project_path
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Invalid project path")
        
    vulnerabilities = []
    
    patterns = {
        "Hardcoded API Key": r"(?i)(api_key|apikey|secret|token)\s*=\s*['\"][a-zA-Z0-9_\-]{16,}['\"]",
        "SQL Injection Risk": r"(?i)execute\s*\(\s*f?['\"].*?\{.*?\}",
        "Eval Usage": r"\beval\s*\(",
        "Exposed Password": r"(?i)password\s*=\s*['\"][^'\"]+['\"]"
    }
    
    for root, _, files in os.walk(path):
        if "node_modules" in root or ".venv" in root or ".git" in root:
            continue
            
        for file in files:
            if not file.endswith(('.py', '.js', '.jsx', '.ts', '.tsx')):
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    
                rel_path = os.path.relpath(filepath, path)
                
                for idx, line in enumerate(lines):
                    for vuln_type, pattern in patterns.items():
                        if re.search(pattern, line):
                            # Mask evidence
                            evidence = line.strip()
                            if "api_key" in evidence.lower() or "secret" in evidence.lower() or "token" in evidence.lower():
                                evidence = re.sub(r"(['\"])[^'\"]+(['\"])", r"\1********\2", evidence)
                                
                            vulnerabilities.append({
                                "file_name": rel_path,
                                "line_number": idx + 1,
                                "type": vuln_type,
                                "severity": "high" if "Key" in vuln_type or "SQL" in vuln_type else "medium",
                                "evidence": evidence[:100]
                            })
            except Exception:
                continue
                
    return {"status": "success", "vulnerabilities": vulnerabilities}

@router.post("/performance")
async def performance_scan(data: PathInput):
    """Scan for sync file reads, missing async handlers, and blocking code."""
    path = data.project_path
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Invalid project path")
        
    issues = []
    
    patterns = {
        "Synchronous File Read (JS)": (r"\breadFileSync\b", "Use asynchronous fs.readFile instead to avoid blocking the event loop."),
        "Missing Async/Await": (r"\b(?<!await\s)fetch\(", "Consider using await with fetch for cleaner asynchronous code."),
        "Blocking Sleep (Python)": (r"\btime\.sleep\(", "Use asyncio.sleep() in async functions instead of blocking time.sleep().")
    }
    
    for root, _, files in os.walk(path):
        if "node_modules" in root or ".venv" in root or ".git" in root:
            continue
            
        for file in files:
            if not file.endswith(('.py', '.js', '.ts')):
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    
                rel_path = os.path.relpath(filepath, path)
                
                for idx, line in enumerate(lines):
                    for issue_name, (pattern, suggestion) in patterns.items():
                        if re.search(pattern, line):
                            issues.append({
                                "file_name": rel_path,
                                "line_number": idx + 1,
                                "issue": issue_name,
                                "suggestion": suggestion,
                                "severity": "medium"
                            })
            except Exception:
                continue
                
    return {"status": "success", "issues": issues}

@router.post("/dead-code")
async def dead_code_scan(data: PathInput):
    """Detect unused imports, variables, and empty functions."""
    path = data.project_path
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Invalid project path")
        
    issues = []
    
    patterns = {
        "Empty Function (Python)": r"def\s+\w+\s*\(.*?\)\s*:\s*\n\s*pass\b",
        "Empty Function (JS)": r"function\s+\w+\s*\(.*?\)\s*\{\s*\}",
        "TODO Comment": r"(?i)#\s*todo:|//\s*todo:"
    }
    
    for root, _, files in os.walk(path):
        if "node_modules" in root or ".venv" in root or ".git" in root:
            continue
            
        for file in files:
            if not file.endswith(('.py', '.js', '.ts')):
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    lines = content.split('\n')
                    
                rel_path = os.path.relpath(filepath, path)
                
                for idx, line in enumerate(lines):
                    if re.search(patterns["TODO Comment"], line):
                        issues.append({
                            "file_name": rel_path,
                            "line_number": idx + 1,
                            "type": "Unresolved TODO",
                            "code_snippet": line.strip()[:100]
                        })
                        
                # Simple empty function checks (regex over multiple lines is tricky, just scanning for single line equivalents)
                for i in range(len(lines) - 1):
                    if "def " in lines[i] and "pass" in lines[i+1] and len(lines[i+1].strip()) == 4:
                        issues.append({
                            "file_name": rel_path,
                            "line_number": i + 1,
                            "type": "Empty Function",
                            "code_snippet": lines[i].strip()
                        })
            except Exception:
                continue
                
    return {"status": "success", "issues": issues}

@router.post("/bundle-size")
async def bundle_size(data: PathInput):
    """Estimate production bundle size based on dependencies and file sizes."""
    path = data.project_path
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Invalid project path")
        
    total_size = 0
    package_json_path = os.path.join(path, "package.json")
    
    # Very rough heuristic: calculate total JS size, add a modifier if heavy packages are found
    for root, _, files in os.walk(path):
        if "node_modules" in root or ".venv" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.css')):
                total_size += os.path.getsize(os.path.join(root, file))
                
    estimated_size_kb = (total_size / 1024) * 0.4  # Assume 60% compression/minification
    
    optimizations = [
        "Enable Tree Shaking in your bundler.",
        "Use React.lazy() for route-level code splitting."
    ]
    
    heavy_deps = False
    if os.path.exists(package_json_path):
        try:
            with open(package_json_path, 'r') as f:
                pkg = json.load(f)
                deps = str(pkg.get("dependencies", {})) + str(pkg.get("devDependencies", {}))
                if "moment" in deps or "lodash" in deps:
                    heavy_deps = True
                    estimated_size_kb += 150
                    optimizations.append("Replace 'moment' with 'date-fns' or 'dayjs'.")
                    optimizations.append("Import specific functions from 'lodash' instead of the full library.")
        except Exception:
            pass

    return {
        "status": "success",
        "estimated_size": f"{estimated_size_kb:.2f} KB",
        "optimization_suggestions": optimizations,
        "potential_savings": "Up to 40%" if heavy_deps else "10-15%"
    }

@router.get("/history")
async def get_history():
    """Return last 10 analyses."""
    records = await db.get_analysis_history(limit=10)
    return {"status": "success", "history": records}

@router.post("/compare")
async def compare_projects(data: CompareInput):
    """Return side-by-side comparison of two projects."""
    proj1 = await db.get_analysis_by_id(data.project_id_1)
    proj2 = await db.get_analysis_by_id(data.project_id_2)
    
    if not proj1 or not proj2:
        raise HTTPException(status_code=404, detail="One or both projects not found.")
        
    return {
        "status": "success",
        "comparison": {
            "project_1": proj1,
            "project_2": proj2
        }
    }

@router.post("/export")
async def export_report(data: ExportInput):
    """Generate analysis report and send via Resend email."""
    if not settings.has_resend:
        return {"status": "error", "message": "Resend API not configured"}
        
    proj = await db.get_analysis_by_id(data.project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "onboarding@resend.dev",
                    "to": [data.email],
                    "subject": f"Analysis Report: {proj.get('project_name', 'Project')}",
                    "html": f"<h1>Analysis Report</h1><p>Health Score: {proj.get('health_score', 0)}</p><p>Framework: {proj.get('framework', 'Unknown')}</p>"
                }
            )
            
            if resp.status_code in (200, 201):
                return {"status": "success", "message": "Report sent successfully."}
            else:
                return {"status": "error", "message": f"Failed to send email: {resp.text}"}
    except Exception as e:
        logger.error(f"Export failed: {e}")
        return {"status": "error", "message": str(e)}
