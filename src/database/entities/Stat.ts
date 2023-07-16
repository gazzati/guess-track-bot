import { Column, Entity, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity({ name: "stats" })
export class Stat {
  @PrimaryColumn()
  id: number

  @Column()
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
