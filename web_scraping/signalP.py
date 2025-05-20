import aiohttp
import aiofiles
import re
from bs4 import BeautifulSoup

# |-----------------------------------Signal Prediction---------------------------|
async def scrape_signalP(session, batch_length, batch_index, batch_fasta_path, url):
    """Scrapes SignalP tool"""
    print(f"Processing SignalP Batch {batch_index + 1}")
    async with aiofiles.open(batch_fasta_path, "rb") as f:
        file_data = await f.read()  # Read file asynchronously

    form_data = aiohttp.FormData()  # Create FormData object
    form_data.add_field("protfile", file_data, filename=batch_fasta_path, content_type="text/plain")  

    payload = {
        # "name": f"Job_Batch_{batch_index + 1}",
        "protseq": "",
        "format": "short",
    }
    # Add additional form fields from payload
    for key, value in payload.items():
        form_data.add_field(key, str(value))
    
    try:
        async with session.post(url, data=form_data) as response:
            html = await response.text()
            if response.status == 200:
                soup = BeautifulSoup(html, 'html.parser')
                # print(soup)
                data = soup.find("pre").get_text()
                # result_cells = soup.find_all("td")
                # Parse results for each sequence
                lines = data.strip().split("\n")[1:]  # Skip the header
                results = ["Found" if re.split(r'\s+', line.strip())[-2]=='Y' else "Not Found" for line in lines ]
                # print(results)
                print(f"Batch {batch_index + 1} of Signal P processed successfully.")
                return (results,batch_index,'Signal P')
            
            else:
                print(f"Batch {batch_index + 1}: Signal P Server returned status {response.status_code}.")
                return (["Network Error"] * batch_length, batch_index,'Signal P')
    except Exception as e:
        print(f"Batch {batch_index + 1}: Signal P Error - {e}")
        return (["Submission Failed"] * batch_length, batch_index,'Signal P')

    # Implement SignalP scraping logic here...
    # return (["SignalP Data"] * batch_length, batch_index, "Signal P")