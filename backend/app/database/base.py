from pydantic import BaseModel

class TextItem(BaseModel):
    text: str