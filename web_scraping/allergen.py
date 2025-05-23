import aiohttp
import aiofiles
from bs4 import BeautifulSoup
# -------------------------- Antigen Prediction ---------------------------#
async def scrape_allergen(session, batch_length, batch_index, batch_fasta_path, url, selected_value, method):
    """Scrapes allergenicity tool"""
    print(f"Processing Allergen Batch {batch_index + 1}")
    async with aiofiles.open(batch_fasta_path, 'r') as f:
        fasta_content = await f.read()

    payload = {
        "name": f"Job_Batch_{batch_index + 1}", 
        "seq": fasta_content, 
        "terminus": int(method), 
        "svm_th": float(selected_value)
    }
    print("Allergen payload->",payload)
    try:
        async with session.post(url, data=payload) as response:
            html = await response.text()
            if response.status == 200:
                soup = BeautifulSoup(html, 'html.parser')
                result_cells = soup.find_all("td")
                results = [result_cells[6 + i * 6].get_text().strip() if i * 6 + 6 < len(result_cells) else "Error" for i in range(batch_length)]
                print(f"Batch {batch_index + 1} of Allergen processed successfully.")
                # print("Allergen Results:", results)
                return (results, batch_index, "Allergen Test")
            else:
                print(f"Batch {batch_index + 1}: Allergen Server returned status {response.status}, {response}.")
                return (["Network Error"] * batch_length, batch_index, "Allergen Test")
    except Exception as e:
        print(f"Error in Allergen Batch {batch_index + 1}: {e}")
        return ([f"Error: {e}"] * batch_length, batch_index, "Allergen Test")