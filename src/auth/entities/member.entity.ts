import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

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
