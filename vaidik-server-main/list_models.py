import os
from openai import OpenAI

client = OpenAI(api_key="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")

try:
    models = client.models.list()
    model_ids = [model.id for model in models.data]
    model_ids.sort()
    for m_id in model_ids:
        print(m_id)
except Exception as e:
    print(f"Error: {e}")
