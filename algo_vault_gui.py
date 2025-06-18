#AbdulRahman Essam 320230120

# 1. Linear Search
def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1

# 2. Binary Search (Requires sorted array)
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

# 3. Max Difference - Brute Force
def max_diff_brute_force(arr):
    max_diff = 0
    n = len(arr)
    for i in range(n):
        for j in range(i + 1, n):
            max_diff = max(max_diff, arr[j] - arr[i])
    return max_diff

# 4. Max Difference - Best Time Complexity
def max_diff_optimized(arr):
    min_val = arr[0]
    max_diff = 0
    for i in range(1, len(arr)):
        max_diff = max(max_diff, arr[i] - min_val)
        min_val = min(min_val, arr[i])
    return max_diff

# 5. Division Algorithm
def division_algorithm(a, b):
    q = a // b
    r = a % b
    return q, r

# 6. Prime Factorization
def prime_factors(n):
    factors = []
    i = 2
    while i * i <= n:
        while n % i == 0:
            factors.append(i)
            n //= i
        i += 1
    if n > 1:
        factors.append(n)
    return factors

# 7. GCD (Euclidean Algorithm)
def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

# 8. LCM
def lcm(a, b):
    return abs(a * b) // gcd(a, b)

# 9. Base-B Expansion
def base_b_expansion(n, base):
    if n == 0:
        return [0]
    digits = []
    while n > 0:
        digits.append(n % base)
        n //= base
    return digits[::-1]

# 10. Binary Addition
def binary_add(a, b):
    result = ""
    carry = 0
    i, j = len(a) - 1, len(b) - 1
    while i >= 0 or j >= 0 or carry:
        bit_sum = carry
        if i >= 0:
            bit_sum += int(a[i])
            i -= 1
        if j >= 0:
            bit_sum += int(b[j])
            j -= 1
        result = str(bit_sum % 2) + result
        carry = bit_sum // 2
    return result

# === GUI Interface ===
import tkinter as tk
from tkinter import messagebox

def run_algorithm():
    choice = algo_var.get()
    input_text = input_entry.get()

    try:
        if choice == "Linear Search":
            arr, target = eval(input_text)
            result = linear_search(arr, target)
        elif choice == "Binary Search":
            arr, target = eval(input_text)
            result = binary_search(sorted(arr), target)
        elif choice == "Max Difference (Brute Force)":
            arr = eval(input_text)
            result = max_diff_brute_force(arr)
        elif choice == "Max Difference (Optimized)":
            arr = eval(input_text)
            result = max_diff_optimized(arr)
        elif choice == "Division Algorithm":
            a, b = eval(input_text)
            result = division_algorithm(a, b)
        elif choice == "Prime Factorization":
            n = int(input_text)
            result = prime_factors(n)
        elif choice == "GCD":
            a, b = eval(input_text)
            result = gcd(a, b)
        elif choice == "LCM":
            a, b = eval(input_text)
            result = lcm(a, b)
        elif choice == "Base-B Expansion":
            n, base = eval(input_text)
            result = base_b_expansion(n, base)
        elif choice == "Binary Addition":
            a, b = eval(input_text)
            result = binary_add(a, b)
        else:
            result = "Invalid choice."
        output_label.config(text="Result: " + str(result))
    except Exception as e:
        messagebox.showerror("Error", str(e))

# === GUI Interface ===
root = tk.Tk()
root.title("Essential Algorithms GUI")
root.geometry("500x350")

# Variable and Mapping for Input Formats
algo_var = tk.StringVar(root)
format_hint_var = tk.StringVar(root)

input_formats = {
    "Linear Search": "Example: [1,2,3,4], 3",
    "Binary Search": "Example: [5,2,9,1], 9",
    "Max Difference (Brute Force)": "Example: [7,2,5,1,6]",
    "Max Difference (Optimized)": "Example: [7,2,5,1,6]",
    "Division Algorithm": "Example: 10, 3",
    "Prime Factorization": "Example: 84",
    "GCD": "Example: 20, 28",
    "LCM": "Example: 12, 15",
    "Base-B Expansion": "Example: 31, 2",
    "Binary Addition": "Example: '1010', '110"
}

# Function to update the input format hint
def update_format_hint(*args):
    choice = algo_var.get()
    hint = input_formats.get(choice, "Enter input according to algorithm requirements.")
    format_hint_var.set(hint)

# Trace the variable to detect changes
algo_var.trace_add('write', update_format_hint)

# Initial Setting
algo_var.set("Linear Search")
update_format_hint()

# Widgets
tk.Label(root, text="Select Algorithm:").pack(pady=5)
tk.OptionMenu(root, algo_var, *input_formats.keys()).pack()

tk.Label(root, textvariable=format_hint_var, fg="gray").pack(pady=5)

tk.Label(root, text="Enter Input:").pack(pady=5)
input_entry = tk.Entry(root, width=50)
input_entry.pack(pady=5)

output_label = tk.Label(root, text="Result: ")
output_label.pack(pady=5)

# Run Algorithm Handler

def run_algorithm():
    choice = algo_var.get()
    input_text = input_entry.get()
    try:
        if choice == "Linear Search":
            arr, target = eval(input_text)
            result = linear_search(arr, target)
        elif choice == "Binary Search":
            arr, target = eval(input_text)
            result = binary_search(sorted(arr), target)
        # ... (rest of handlers) ...
        output_label.config(text="Result: " + str(result))
    except Exception as e:
        messagebox.showerror("Error", str(e))

# Run Button

run_btn = tk.Button(root, text="Run", command=run_algorithm)
run_btn.pack(pady=10)

root.mainloop()
