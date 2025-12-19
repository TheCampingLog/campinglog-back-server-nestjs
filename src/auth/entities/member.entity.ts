import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Board } from 'src/board/entities/board.entity';
import { BoardLike } from 'src/board/entities/board-like.entity';
import { Comment } from 'src/board/entities/comment.entity';
import { RefreshToken } from './refresh-token.entity';
import { Review } from 'src/campinfo/entities/review.entity';

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

  @Column({ name: 'profile_image', type: 'varchar', nullable: true })
  profileImage?: string | null;

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
  boards?: Board[];

  @OneToMany(() => Comment, (comment) => comment.member, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  comments?: Comment[];

  @OneToMany(() => BoardLike, (boardLike) => boardLike.member, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  board_like?: BoardLike[];

  @OneToMany(() => Review, (reviews) => reviews.member, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  reviews?: Review[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.member, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  refresh_tokens?: RefreshToken[];

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
