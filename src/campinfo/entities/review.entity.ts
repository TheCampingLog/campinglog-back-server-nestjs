import { Member } from 'src/auth/entities/member.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { getPrimaryGeneratedColumnType } from 'src/config/database.config';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn({ type: getPrimaryGeneratedColumnType() })
  id: number;

  @Column({ name: 'map_x', nullable: false })
  mapX: string;

  @Column({ name: 'map_y', nullable: false })
  mapY: string;

  @Column({ name: 'review_content', nullable: false })
  reviewContent: string;

  @Column({
    name: 'review_score',
    nullable: false,
  })
  reviewScore: number;

  @Column({ name: 'review_image', nullable: true })
  reviewImage?: string;

  @CreateDateColumn({ name: 'create_at' })
  createAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updateAt: Date;

  @ManyToOne(() => Member, (member) => member.reviews, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'email', referencedColumnName: 'email' })
  member: Member;
}
