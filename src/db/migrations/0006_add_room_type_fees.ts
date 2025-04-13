import { mysqlTable, decimal } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export async function up(db: any): Promise<void> {
  // First add the columns as nullable
  await db.schema.alterTable('fee_structures').addColumn(
    'single_room_fees',
    decimal('single_room_fees', { precision: 10, scale: 2 })
  );
  
  await db.schema.alterTable('fee_structures').addColumn(
    'double_room_fees',
    decimal('double_room_fees', { precision: 10, scale: 2 })
  );
  
  await db.schema.alterTable('fee_structures').addColumn(
    'triple_room_fees',
    decimal('triple_room_fees', { precision: 10, scale: 2 })
  );

  // Update existing records with default values
  await db.execute(sql`
    UPDATE fee_structures 
    SET single_room_fees = hostel_fees * 1.5,
        double_room_fees = hostel_fees * 1.2,
        triple_room_fees = hostel_fees
    WHERE single_room_fees IS NULL
  `);

  // Now make the columns NOT NULL
  await db.execute(sql`
    ALTER TABLE fee_structures 
    MODIFY COLUMN single_room_fees DECIMAL(10,2) NOT NULL,
    MODIFY COLUMN double_room_fees DECIMAL(10,2) NOT NULL,
    MODIFY COLUMN triple_room_fees DECIMAL(10,2) NOT NULL
  `);
}

export async function down(db: any): Promise<void> {
  await db.schema.alterTable('fee_structures').dropColumn('single_room_fees');
  await db.schema.alterTable('fee_structures').dropColumn('double_room_fees');
  await db.schema.alterTable('fee_structures').dropColumn('triple_room_fees');
} 