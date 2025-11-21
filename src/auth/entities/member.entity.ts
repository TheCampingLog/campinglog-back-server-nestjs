import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Board } from '../../board/entities/board.entity';
import { BoardLike } from '../../board/entities/board-like.entity';
import { Comment } from '../../board/entities/comment.entity';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum MemberGrade {
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  RED = 'RED',
  BLACK = 'BLACK',
}

@Entity('members')
export class Member {
  @PrimaryColumn({ name: 'email' })
  email: string;

  @Column({ name: 'password', nullable: false })
  password: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'nickname', nullable: false })
  nickname: string;

  @Column({ name: 'birthday', nullable: false })
  birthday: Date;

  @Column({ name: 'phone_number', nullable: false })
  phoneNumber: string;

  @Column({ name: 'profile_image', nullable: true })
  profileImage?: string;

  @Column({ name: 'role', nullable: false })
  role?: string;

  @Column({ name: 'member_grade', nullable: false })
  memberGrade?: string;

  @CreateDateColumn({ name: 'join_date', nullable: false })
  joinDate?: Date;

  @Column({ name: 'oauth', nullable: false })
  oauth?: boolean;

  @OneToMany(() => Board, (board) => board.member, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  boards: Board[];

  @OneToMany(() => Comment, (comment) => comment.member, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  comments: Comment[];

  @OneToMany(() => BoardLike, (boardLike) => boardLike.member, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  board_like: BoardLike[];

  @BeforeInsert()
  setDefaults?(): void {
    if (!this.role) {
      this.role = Role.USER;
    }

    if (!this.memberGrade) {
      this.memberGrade = MemberGrade.GREEN;
    }

    if (!this.oauth) {
      this.oauth = false;
    }
  }
}
