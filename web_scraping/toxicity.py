import aiohttp
import aiofiles
from bs4 import BeautifulSoup
from multidict import MultiDict

# |-----------------------------------Toxicity Prediction---------------------------|
async def scrape_toxicity(session, batch_length, batch_index, batch_fasta_path, url, method, eval, threshold):
    # async with aiohttp.ClientSession() as session:
    print(f"Toxicity Batch {batch_index + 1} processing.")
    async with aiofiles.open(batch_fasta_path, "r") as f:
        file_data = await f.read()  # Read file asynchronously
    payload = MultiDict([
        ("seq", file_data),
        ("method", method),
        ("eval", eval),
        ("thval", threshold),
        # ("field[]", "4"),
        # ("field[]", "7"),
        # ("field[]", "9"),
        # ("field[]", "11"),
        # ("field[]", "13"),
    ])
    # async with session.post(url, data=payload,headers=headers) as response:
    async with session.post(url, data=payload) as response:
        html = await response.text()
        # print(html)
        result=[]
        if response.status == 200:
            soup = BeautifulSoup(html, "html.parser")
            meta_refresh = soup.find("meta", attrs={"http-equiv": "refresh"})
            if meta_refresh:
                # Extract the URL from the content attribute
                refresh_url = meta_refresh["content"].split("url=")[-1]
                final_url = f"https://webs.iiitd.edu.in/raghava/toxinpred/{refresh_url}"
                # print(final_url)
                # Step 3: Send a GET request to the redirected URL
                final_response = await session.get(final_url)
                if final_response.status == 200:
                    # print("Final Response Text:\n", final_response.text)
                    html_content = await final_response.text()  # Await the response text
                    # print(html_content)
                    soup = BeautifulSoup(html_content, "html.parser")
                    # Find all rows in the table
                    rows = soup.find("table", {"id": "tableTwo"}).find("tbody").find_all("tr")

                    # Extract toxin/non-toxin prediction
                    result = []
                    for row in rows:
                        columns = row.find_all("td")
                        if len(columns) >= 4:  # Ensuring there are enough columns
                            # peptide_sequence = columns[1].text.strip()
                            prediction = columns[3].text.strip()  # Extracting "Toxin" or "Non-Toxin"
                            result.append( prediction)
                    print(f"Batch {batch_index + 1} of Toxicity processed successfully.")
                    return (result,batch_index,'Toxicity Test')

                else:
                    print(f"Batch {batch_index + 1}: Toxicity Server returned status {response.status}.")
                    return (["Network Error"] * batch_length, batch_index,'Toxicity Test')

            else:
                print(f"Batch {batch_index + 1}: Toxicity ERROR:NO REDIRECTION PAGE FOUND")
                return (["Rediriction Error"] * batch_length, batch_index,'Toxicity Test')

        else:
            print(f"Batch {batch_index + 1}: Toxicity Server returned status {response.status_code}.")
            return (["Network Error"] * batch_length, batch_index,'Toxicity Test')