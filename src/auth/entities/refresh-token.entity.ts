import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Member } from './member.entity';

@Entity('refresh_tokens')
@Index(['jti'], { unique: true })
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'jti', nullable: false })
  jti: string;

  @Column({ name: 'used', nullable: false, default: 0 })
  used?: number;

  @Column({ name: 'expires_at', nullable: false })
  expiresAt: Date;

  @ManyToOne(() => Member, (member) => member.refresh_tokens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'email', referencedColumnName: 'email' })
  member: Member;

  isUsed(): boolean {
    return this.used !== null && this.used === 1;
  }

  isExpired(): boolean {
    return this.expiresAt !== null && this.expiresAt < new Date();
  }

  isValid(): boolean {
    return !this.isUsed() && !this.isExpired();
  }
}
