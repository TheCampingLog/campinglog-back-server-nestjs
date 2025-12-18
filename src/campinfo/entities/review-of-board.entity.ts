import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('review_of_board')
@Unique('uk_review_of_board_mapx_mapy', ['mapX', 'mapY'])
export class ReviewOfBoard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'review_count', type: 'int', nullable: false })
  reviewCount: number;

  @Column({
    name: 'review_average',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: false,
  })
  reviewAverage: number;

  @Column({ name: 'map_x', type: 'varchar', length: 255, nullable: false })
  mapX: string;

  @Column({ name: 'map_y', type: 'varchar', length: 255, nullable: false })
  mapY: string;
}
