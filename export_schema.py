from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql
from models import Base

sql_statements = []
for table in Base.metadata.sorted_tables:
    # Generate the CREATE TABLE statement using the PG dialect directly
    create_stmt = str(CreateTable(table).compile(dialect=postgresql.dialect()))
    sql_statements.append(create_stmt.strip() + ";")

with open("schema.sql", "w") as f:
    f.write("\n\n".join(sql_statements))

print("Schema written to schema.sql")
