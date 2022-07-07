-- CreateTable
CREATE TABLE "history2" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schema_name" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "user" TEXT NOT NULL DEFAULT current_user,
    "new_value" JSONB,
    "old_value" JSONB,

    CONSTRAINT "history2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "history2_created_at_idx" ON "history2"("created_at");

-- Create change trigger (@see https://www.cybertec-postgresql.com/en/tracking-changes-in-postgresql/)
CREATE FUNCTION change_trigger() RETURNS trigger AS $$
    BEGIN

            IF      TG_OP = 'INSERT'
            THEN

                    INSERT INTO history2 (table_name, schema_name, operation, new_value)
                            VALUES (TG_RELNAME, TG_TABLE_SCHEMA, TG_OP, row_to_json(NEW));
                    RETURN NEW;

            ELSIF   TG_OP = 'UPDATE'
            THEN

                    INSERT INTO history2 (table_name, schema_name, operation, new_value, old_value)
                            VALUES (TG_RELNAME, TG_TABLE_SCHEMA, TG_OP,
                                    row_to_json(NEW), row_to_json(OLD));
                    RETURN NEW;

            ELSIF   TG_OP = 'DELETE'
            THEN

                    INSERT INTO history2 (table_name, schema_name, operation, old_value)
                            VALUES (TG_RELNAME, TG_TABLE_SCHEMA, TG_OP, row_to_json(OLD));
                    RETURN OLD;

            END IF;

    END;
 
$$ LANGUAGE 'plpgsql';

create trigger nft2_history before insert or update or delete on nft2 for each row execute function change_trigger();
create trigger collection2_history before insert or update or delete on collection2 for each row execute function change_trigger();
create trigger base2_history before insert or update or delete on base2 for each row execute function change_trigger();