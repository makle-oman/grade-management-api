import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCreatedByToClass1723700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 created_by 列
    await queryRunner.addColumn('classes', new TableColumn({
      name: 'created_by',
      type: 'varchar',
      length: '36',
      isNullable: true,
    }));

    // 添加外键约束
    await queryRunner.createForeignKey('classes', new TableForeignKey({
      columnNames: ['created_by'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键约束
    const table = await queryRunner.getTable('classes');
    const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('created_by') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('classes', foreignKey);
    }

    // 删除列
    await queryRunner.dropColumn('classes', 'created_by');
  }
}