import User from '../models/User'
import { removeSingleByPropertyOrThrow } from '../utils'

export default class UsersDatabase {
  private users: User[]

  constructor() {
    this.users = []
  }

  get all(): User[] {
    return this.users
  }

  removeById(id: string): void {
    removeSingleByPropertyOrThrow(this.users, 'id', id)
  }
}
