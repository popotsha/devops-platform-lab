import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type EmailDeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';

@Entity({ name: 'email_notifications' })
export class EmailNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'recipient_email', nullable: true })
  recipientEmail?: string;

  @Column({ name: 'email_subject' })
  emailSubject: string;

  @Column({ name: 'email_template', default: 'order_confirmation' })
  emailTemplate: string;

  @Column({ default: 'pending' })
  status: EmailDeliveryStatus;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
