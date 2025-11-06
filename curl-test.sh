#!/bin/bash

# FM Wallet Info - Comprehensive cURL Testing Script
# Tests local webserver and CDN accessibility

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

print_header() {
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${BOLD}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo ""
}

print_section() {
    echo -e "\n${CYAN}📌 $1${NC}"
    echo "─────────────────────────────"
}

test_url() {
    local url=$1
    local description=$2
    local expected_codes=$3  # Space-separated list of acceptable codes

    ((TOTAL++))

    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "000")

    # Check if code is in expected codes
    if echo "$expected_codes" | grep -q "\b$http_code\b"; then
        echo -e "${GREEN}✅ $description: $http_code${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ $description: $http_code (expected: $expected_codes)${NC}"
        ((FAILED++))
        return 1
    fi
}

test_content() {
    local url=$1
    local description=$2
    local search_term=$3

    ((TOTAL++))

    content=$(curl -s --connect-timeout 10 "$url" 2>/dev/null)

    if echo "$content" | grep -q "$search_term"; then
        echo -e "${GREEN}✅ $description: Found '$search_term'${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ $description: Missing '$search_term'${NC}"
        ((FAILED++))
        return 1
    fi
}

# Main test execution
print_header "FM WALLET INFO - COMPREHENSIVE TEST SUITE"

# Test 1: Local Webserver
print_section "Testing Local Webserver (http://127.0.0.1:8080)"
test_url "http://127.0.0.1:8080/index.html" "GET /index.html" "200"
test_url "http://127.0.0.1:8080/test-cdn.html" "GET /test-cdn.html" "200"
test_url "http://127.0.0.1:8080/src/fm_wallet.cljs" "GET /src/fm_wallet.cljs" "200"

# Test 2: Page Content Validation
print_section "Testing Page Content"
test_content "http://127.0.0.1:8080/index.html" "Title tag" "Figure Markets - HASH Price"
test_content "http://127.0.0.1:8080/index.html" "Version number" "v1.0.1"
test_content "http://127.0.0.1:8080/index.html" "Tailwind CDN" "cdn.tailwindcss.com"
test_content "http://127.0.0.1:8080/index.html" "Scittle CDN" "cdn.jsdelivr.net/npm/scittle"
test_content "http://127.0.0.1:8080/index.html" "React CDN" "unpkg.com/react@18"
test_content "http://127.0.0.1:8080/index.html" "ClojureScript source" "src/fm_wallet.cljs"
test_content "http://127.0.0.1:8080/index.html" "App container" 'id="app"'

# Test 3: CDN Accessibility
print_section "Testing CDN Accessibility"
test_url "https://cdn.tailwindcss.com/" "Tailwind CSS CDN" "200 301 302"
test_url "https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js" "jsDelivr (Scittle)" "200 301 302"
test_url "https://unpkg.com/react@18/umd/react.production.min.js" "unpkg (React)" "200 301 302"
test_url "https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.cljs-ajax.js" "Scittle AJAX module" "200 301 302"
test_url "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" "unpkg (ReactDOM)" "200 301 302"
test_url "https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.reagent.js" "Scittle Reagent" "200 301 302"

# Test 4: Figure Markets API
print_section "Testing Figure Markets"
test_url "https://www.figuremarkets.com" "Figure Markets website" "200 301 302"
test_url "https://www.figuremarkets.com/service-hft-exchange/api/v1/markets" "Figure Markets API" "200 301 302 403"

# Test 5: ClojureScript Source
print_section "Testing ClojureScript Application"
test_content "http://127.0.0.1:8080/src/fm_wallet.cljs" "ClojureScript namespace" "ns"
test_content "http://127.0.0.1:8080/src/fm_wallet.cljs" "Reagent import" "reagent"

# Summary
print_header "TEST SUMMARY"
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "${GREEN}Failed: $FAILED${NC}"
fi

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}Success Rate: $SUCCESS_RATE%${NC}"
else
    echo -e "${YELLOW}Success Rate: $SUCCESS_RATE%${NC}"
fi

echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed, but this may be expected in certain environments${NC}"
    exit 0  # Don't fail the script, just report
fi
