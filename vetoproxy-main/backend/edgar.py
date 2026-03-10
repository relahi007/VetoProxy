import requests


class FilingNotFoundError(Exception):
    pass


def fetch_proxy_filing(ticker: str) -> str:
    # We MUST declare who we are, or the SEC will block the request
    headers = {
        "User-Agent": "VetoProxy research@vetoapp.com"
    }

    # 1. Build URL for the SEC EFTS Search API
    search_url = f"https://efts.sec.gov/LATEST/search-index?q=%22DEF+14A%22&entity={ticker}&dateRange=custom&startdt=2020-01-01&enddt=2026-12-31"    # 2. GET the search results
    response = requests.get(search_url, headers=headers)
    if response.status_code != 200:
        raise FilingNotFoundError(f"SEC Search API failed with status {response.status_code}")

    # 3. Parse JSON hits
    data = response.json()
    hits = data.get('hits', {}).get('hits', [])

    # 4. If 0 hits: raise FilingNotFoundError
    if not hits:
        raise FilingNotFoundError(f"No DEF 14A found for {ticker}")

    # 5. Extract the document ID and format the actual SEC archive URL
    first_hit = hits[0]
    doc_id = first_hit['_id']  # Looks like 'adsh:filename.htm'

    if ":" in doc_id:
        adsh, filename = doc_id.split(":", 1)
        # The SEC URL requires the CIK number without leading zeros, and the ADSH without dashes
        cik = str(int(first_hit['_source']['ciks'][0]))
        adsh_clean = adsh.replace("-", "")
        doc_url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{adsh_clean}/{filename}"
    else:
        # Fallback just in case
        doc_url = f"https://www.sec.gov/Archives/edgar/{doc_id}"

    # 6. GET the full proxy document
    doc_response = requests.get(doc_url, headers=headers)

    # 7. If non-200 response: raise FilingNotFoundError
    if doc_response.status_code != 200:
        raise FilingNotFoundError(f"Failed to fetch document at {doc_url}")

    # 8. Return more characters — HTML tags inflate size, stripping later
    #    leaves ~20-30k of actual readable proposal text
    return doc_response.text[:120000]


# --- TEST BLOCK ---
if __name__ == '__main__':
    print("Fetching AAPL proxy filing from SEC EDGAR...")
    try:
        result = fetch_proxy_filing('AAPL')
        print("\n--- FIRST 500 CHARACTERS ---")
        print(result[:500])
        print("\nSUCCESS — filing fetched")
    except Exception as e:
        print(f"\nFAILED: {e}")
