from quart import abort
from .acc_transform import acc_predictor
import joblib
import os
from typing import List
from io import StringIO
from Bio import SeqIO


def parse_fasta_sequences(fasta_str: str) -> List[str]:
    sequences = []
    fasta_io = StringIO(fasta_str)

    for record in SeqIO.parse(fasta_io, "fasta"):
        sequences.append({
            "id": record.id,
            "sequence": str(record.seq)
        })
    return sequences

def predict_antigens(prediction_type: str, sequence_input: str, lag=8):
    if(prediction_type == "bacteria"):
        model_type = "bacterial_model.pkl"
        lag=8
    elif(prediction_type == "virus"):
        model_type = "viral_model.pkl"
        lag=5
    else:
        model_type = "tumor_model.pkl"
        lag=7

    # Load model
    model_path = os.path.join(os.path.dirname(__file__), "models", model_type)
    model = joblib.load(model_path)

    fasta_sequences = parse_fasta_sequences(sequence_input)
    
    try:
        # Process the input data
        if fasta_sequences:
            results=[]
            for item in fasta_sequences:
            # sequence = fasta_data.split()[-1]  # Get the last sequence from the input
                sequence = item["sequence"]
                # print(f"Processing sequence: {sequence}")
                input_data = acc_predictor(sequence, lag)  
                # print(input_data.mean())
                input_data = input_data.reshape(1, -1)  # Reshape for model prediction
                # print(f"Input data shape: {input_data.shape}")
                prediction = model.predict(input_data)
                results.append({
                    "id": item["id"],
                    "sequence": item["sequence"],
                    "prediction": "Antigen" if prediction == 1 else "Non-Antigen"
                })
        return results
    except Exception as e:
        abort(400, str(e))