"""
=============================================================================
High-Concurrency POS Billing & Inventory Load Test (100+ Simultaneous Workers)
=============================================================================
This script tests your backend's capacity to handle 100+ simultaneous 
billing & inventory transactions, verifying:
  1. Concurrency throughput & Requests Per Second (RPS)
  2. Latency percentiles (P50, P95, P99)
  3. Database lock contention & connection pool stability
  4. Stock consistency (Zero inventory over-selling / race conditions)

Usage:
  python load_test_transactions.py --url http://localhost:8080/api --concurrency 100 --requests 100
"""

import sys
import time
import json
import random
import argparse
import statistics
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import urllib.request
    import urllib.error
except ImportError:
    pass


def send_http_request(url, method="GET", headers=None, data=None, timeout=30):
    if headers is None:
        headers = {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return status, parsed, None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed, str(e)
    except Exception as e:
        return 0, None, str(e)


def login(base_url, username, password):
    url = f"{base_url}/auth/login"
    payload = {"username": username, "password": password}
    status, res, err = send_http_request(url, method="POST", data=payload)
    if status == 200 and isinstance(res, dict) and "token" in res:
        return res["token"]
    raise RuntimeError(f"Failed to authenticate user '{username}' on {url}. Status: {status}, Error: {err}, Response: {res}")


def fetch_or_create_test_products(base_url, token, required_stock=1000):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check existing products
    status, res, err = send_http_request(f"{base_url}/products", method="GET", headers=headers)
    products = []
    if status == 200:
        if isinstance(res, list):
            products = res
        elif isinstance(res, dict) and "content" in res:
            products = res["content"]
            
    # Filter products with stock >= 50
    valid_products = [p for p in products if p.get("stockQuantity", 0) >= 50]
    
    if not valid_products:
        print("[*] Creating a dedicated high-stock benchmark product...")
        barcode = f"BENCH-{int(time.time())}"
        create_payload = {
            "name": "Benchmark Test Product",
            "barcode": barcode,
            "category": "Testing",
            "costPrice": 10.0,
            "sellingPrice": 25.0,
            "stockQuantity": required_stock,
            "minStockLevel": 10,
            "unit": "pcs",
            "isActive": True
        }
        c_status, c_res, c_err = send_http_request(f"{base_url}/products", method="POST", headers=headers, data=create_payload)
        if c_status in [200, 201] and isinstance(c_res, dict) and "id" in c_res:
            valid_products = [c_res]
        else:
            print(f"[!] Warning: Could not auto-create test product ({c_err}). Using first product if available.")
            if products:
                valid_products = [products[0]]
            else:
                raise RuntimeError("No products found and could not create one. Please populate at least 1 product.")
                
    return valid_products


def run_single_transaction(base_url, token, product_id, barrier, timeout=45):
    headers = {"Authorization": f"Bearer {token}"}
    
    txn_payload = {
        "subtotal": 25.0,
        "tax": 2.0,
        "discount": 0.0,
        "total": 27.0,
        "paidAmount": 30.0,
        "change": 3.0,
        "paymentMethod": "cash",
        "items": [
            {
                "productId": product_id,
                "quantity": 1,
                "price": 25.0,
                "subtotal": 25.0,
                "tax": 2.0
            }
        ]
    }
    
    # Wait for all threads to reach barrier so all 100+ requests strike at the exact same millisecond
    barrier.wait()
    
    start_time = time.perf_counter()
    status, res, err = send_http_request(
        f"{base_url}/transactions", 
        method="POST", 
        headers=headers, 
        data=txn_payload, 
        timeout=timeout
    )
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    
    return {
        "status": status,
        "elapsed_ms": elapsed_ms,
        "error": err,
        "success": status in [200, 201]
    }


def main():
    parser = argparse.ArgumentParser(description="100+ Simultaneous POS Billing & Inventory Load Tester")
    parser.add_argument("--url", default="http://localhost:8080/api", help="Base backend API URL")
    parser.add_argument("--username", default="cashier", help="Cashier / Admin username")
    parser.add_argument("--password", default="Bala9677540588#", help="Password")
    parser.add_argument("--concurrency", type=int, default=100, help="Number of simultaneous threads (e.g. 100)")
    parser.add_argument("--requests", type=int, default=100, help="Total transactions to execute concurrently")
    parser.add_argument("--timeout", type=int, default=45, help="HTTP timeout in seconds")
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("  POS SYSTEM CONCURRENCY BENCHMARK & LOAD TEST")
    print(f"  Target URL:        {args.url}")
    print(f"  Simultaneous Hits: {args.concurrency} concurrent threads")
    print(f"  Total Requests:    {args.requests}")
    print("=" * 70)
    
    # 1. Authenticate
    print(f"\n[1/4] Authenticating as '{args.username}'...")
    try:
        token = login(args.url, args.username, args.password)
        print("  [OK] JWT Token successfully acquired.")
    except Exception as e:
        print(f"  [FAIL] Login error: {e}")
        sys.exit(1)
        
    # 2. Get Test Products & Initial Stock
    print("\n[2/4] Inspecting inventory before test...")
    try:
        products = fetch_or_create_test_products(args.url, token, required_stock=args.requests + 200)
        target_product = products[0]
        prod_id = target_product["id"]
        initial_stock = target_product.get("stockQuantity", 0)
        print(f"  [OK] Using Product ID {prod_id} ('{target_product.get('name')}')")
        print(f"  [OK] Initial Stock: {initial_stock} units")
    except Exception as e:
        print(f"  [FAIL] Failed to setup products: {e}")
        sys.exit(1)
        
    # 3. Fire Simultaneous Load Test
    print(f"\n[3/4] Launching {args.concurrency} threads synchronized at the same millisecond...")
    barrier = threading.Barrier(args.concurrency)
    results = []
    
    wall_start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [
            executor.submit(run_single_transaction, args.url, token, prod_id, barrier, args.timeout)
            for _ in range(args.requests)
        ]
        for f in as_completed(futures):
            results.append(f.result())
    wall_duration = time.perf_counter() - wall_start
    
    # 4. Fetch Post-Test Stock
    print("\n[4/4] Verifying stock consistency and database integrity...")
    headers = {"Authorization": f"Bearer {token}"}
    p_status, p_res, _ = send_http_request(f"{args.url}/products/{prod_id}", method="GET", headers=headers)
    final_stock = p_res.get("stockQuantity") if (p_status == 200 and isinstance(p_res, dict)) else None
    
    # Analyze metrics
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    latencies = [r["elapsed_ms"] for r in results]
    
    total_count = len(results)
    success_count = len(successful)
    fail_count = len(failed)
    success_rate = (success_count / total_count * 100) if total_count > 0 else 0
    rps = success_count / wall_duration if wall_duration > 0 else 0
    
    latencies.sort()
    p50 = statistics.median(latencies) if latencies else 0
    p90 = latencies[int(len(latencies) * 0.90)] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
    p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0
    avg_lat = statistics.mean(latencies) if latencies else 0
    min_lat = min(latencies) if latencies else 0
    max_lat = max(latencies) if latencies else 0
    
    # Status code breakdown
    status_counts = {}
    for r in results:
        code = r["status"]
        status_counts[code] = status_counts.get(code, 0) + 1
        
    print("\n" + "=" * 70)
    print("                    BENCHMARK RESULTS & REPORT")
    print("=" * 70)
    print(f"Total Requests:       {total_count}")
    print(f"Concurrency Level:    {args.concurrency} simultaneous connections")
    print(f"Wall Clock Time:      {wall_duration:.2f} seconds")
    print(f"Throughput (RPS):     {rps:.2f} transactions/sec")
    print(f"Success Rate:         {success_rate:.1f}% ({success_count} passed, {fail_count} failed)")
    print("-" * 70)
    print("HTTP Response Codes:")
    for code, count in sorted(status_counts.items()):
        status_desc = "OK" if code in [200, 201] else ("Conflict/Lock" if code == 409 else "Error")
        print(f"  HTTP {code} ({status_desc}): {count}")
    print("-" * 70)
    print("Latency Distribution (ms):")
    print(f"  Min:      {min_lat:8.2f} ms")
    print(f"  Avg:      {avg_lat:8.2f} ms")
    print(f"  P50:      {p50:8.2f} ms")
    print(f"  P90:      {p90:8.2f} ms")
    print(f"  P95:      {p95:8.2f} ms")
    print(f"  P99:      {p99:8.2f} ms")
    print(f"  Max:      {max_lat:8.2f} ms")
    print("-" * 70)
    print("Inventory Integrity Check:")
    print(f"  Initial Stock:      {initial_stock}")
    print(f"  Expected Final:     {initial_stock - success_count} (Deducted {success_count} units)")
    print(f"  Actual Final Stock: {final_stock}")
    
    if final_stock is not None:
        if final_stock == (initial_stock - success_count):
            print("  [SUCCESS] Stock deduction is 100% consistent (No race condition or overselling detected!)")
        else:
            print(f"  [ERROR] Stock mismatch! Discrepancy: {final_stock - (initial_stock - success_count)} units.")
    print("=" * 70)


if __name__ == "__main__":
    main()
