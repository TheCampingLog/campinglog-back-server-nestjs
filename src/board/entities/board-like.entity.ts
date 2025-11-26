import {
  CreateDateColumn,
  BeforeInsert,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Board } from './board.entity';
import { Member } from '../../auth/entities/member.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('board_like')
export class BoardLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'like_id', unique: true })
  likeId: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @ManyToOne(() => Board, (board) => board.boardLikes, { nullable: false })
  @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  board: Board;

  @ManyToOne(() => Member, (member) => member.board_like, { nullable: false })
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
  setLikeIdIfEmpty() {
    if (!this.likeId || this.likeId.trim() === '') {
      this.likeId = uuidv4();
    }
  }
}
