import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity({ name: "stats" })
export class Stat {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number

  @Column({ unique: true })
  chat_id: number

  @Column({ nullable: true })
  username: string

  @Column({default: 0})
  answers: number

  @Column({default: 0})
  success_answers: number

  @Column()
  @CreateDateColumn()
  created_at: Date

  @Column()
  @UpdateDateColumn()
  updated_at: Date
}
