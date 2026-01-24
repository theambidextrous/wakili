from typing import List

from lancedb.pydantic import LanceModel, Vector
from lancedb.embeddings import get_registry


# Get the Sentence Transformers embedding function
func = get_registry().get("sentence-transformers").create(
    name="all-MiniLM-L6-v2",
    device="cpu"
)

# Get the embedding dimension
embedding_dim = func.ndims()


class ChunkMetadata(LanceModel):
    filename: str | None
    page_numbers: List[int] | None
    title: str | None


class Chunks(LanceModel):
    metadata: ChunkMetadata
    text: str = func.SourceField()
    vector: Vector(embedding_dim) = func.VectorField()  # type: ignore