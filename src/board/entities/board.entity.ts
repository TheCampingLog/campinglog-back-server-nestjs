import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Member } from '../../auth/entities/member.entity';
import { Comment } from './comment.entity';
import { BoardLike } from './board-like.entity';
import { v4 as uuidv4 } from 'uuid';
import { getPrimaryGeneratedColumnType } from 'src/config/database.config';

@Entity('board')
export class Board {
  @PrimaryGeneratedColumn({ type: getPrimaryGeneratedColumnType() })
  id: number;

  @Column({ name: 'board_id', nullable: false, unique: true })
  boardId: string;

  @Column({ name: 'title', nullable: false })
  title: string;

  @Column({ name: 'content', type: 'text', nullable: false })
  content: string;

  @Column({ name: 'category_name', nullable: false })
  categoryName: string;

  @Column({ name: 'board_image', nullable: true })
  boardImage?: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'comment_count', default: 0 })
  commentCount: number;

  @Column({ name: 'rank', default: 0 })
  rank: number;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @ManyToOne(() => Member, (member) => member.boards, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'email', referencedColumnName: 'email' })
  member: Member;

  @OneToMany(() => Comment, (comment) => comment.board, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  comments: Comment[];

  @OneToMany(() => BoardLike, (boardLike) => boardLike.board, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  boardLikes: BoardLike[];

  getEmail(): string | null {
    return this.member ? this.member.email : null;
  }
  getNickname(): string | null {
    return this.member ? this.member.nickname : null;
  }

  @BeforeInsert()
  setDefaults?(): void {
    if (!this.boardId || this.boardId.trim() === '') {
      this.boardId = uuidv4();
    }
  }
}
