import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('products') // 'products' is the table name in the database
export class ProductEntity {
    @PrimaryColumn()
    index!: number;

    @Column()
    id!: number;

    @Column()
    name!: string;

    @Column('decimal')
    price!: number;

    @Column()
    seoId!: string;

    @Column({nullable: true})
    country?: string;

    @Column()
    category!: string;

    constructor(
        id?: number,
        index?: number,
        name?: string,
        price?: number,
        seoId?: string,
        country?: string,
        category?: string,
    ) {
        this.id = id!;
        this.index = index!;
        this.name = name!;
        this.price = price!;
        this.seoId = seoId!;
        this.country = country;
        this.category = category!;
    }
}
