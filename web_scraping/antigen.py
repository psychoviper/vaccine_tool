import aiofiles
from antigenicity_prediction.prediction import predict_antigens

# |-----------------------------------Antigen Prediction---------------------------|
async def scrape_antigen(session, batch_length, batch_index, batch_fasta_path, url, selected_value):
    """Scrapes antigenicity tool"""
    print(f"Processing Antigen Batch {batch_index + 1}")
    # Implement Antigenicity scraping logic here...
    async with aiofiles.open(batch_fasta_path, 'r') as f:
        fasta_content = await f.read()
    results  = predict_antigens(selected_value, fasta_content)
    print(f"Batch {batch_index + 1} of Antigen processed successfully.")
    result = [r["prediction"] for r in results]
    return (result, batch_index, "Antigen Test")