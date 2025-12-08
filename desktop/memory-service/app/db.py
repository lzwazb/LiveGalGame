import os
from sqlmodel import SQLModel, create_engine, Session


DB_PATH = os.environ.get(
    "MEMORY_DB_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../memory.db"))
)
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
