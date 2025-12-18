import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  JoinColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { Board } from './board.entity';
import { Member } from '../../auth/entities/member.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'comment_id', unique: true })
  commentId: string;

  @Column({ name: 'content', type: 'text', nullable: false })
  content: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @ManyToOne(() => Board, (board) => board.comments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  board: Board;

  @ManyToOne(() => Member, (member) => member.comments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'email', referencedColumnName: 'email' })
  member: Member;

  getBoardId(): string | null {
    return this.board ? this.board.boardId : null;
  }
  getEmail(): string | null {
    return this.member ? this.member.email : null;
  }
  getNickname(): string | null {
    return this.member ? this.member.nickname : null;
  }
  @BeforeInsert()
  setCommentIdIfEmpty() {
    if (!this.commentId || this.commentId.trim() === '') {
      this.commentId = uuidv4();
    }
  }
}
