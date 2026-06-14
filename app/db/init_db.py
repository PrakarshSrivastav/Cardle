from app.db.database import engine, Base
from app.db import models


def init():
    Base.metadata.create_all(bind=engine)
    for table in Base.metadata.tables:
        print(f"  ✓ {table}")


if __name__ == "__main__":
    init()
