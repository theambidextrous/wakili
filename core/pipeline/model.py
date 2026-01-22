from typing import List

from lancedb.pydantic import LanceModel, Vector
from lancedb.embeddings import get_registry


# Get the OpenAI embedding function
func = get_registry().get("openai").create(name="text-embedding-3-large")


class ChunkMetadata(LanceModel):
    """
    You must order the fields in alphabetical order.
    This is a requirement of the Pydantic implementation.
    """

    filename: str | None
    page_numbers: List[int] | None
    title: str | None


# Define the main Schema
class Chunks(LanceModel):
    text: str = func.SourceField()
    vector: Vector(func.ndims()) = func.VectorField()  # type: ignore
    metadata: ChunkMetadata