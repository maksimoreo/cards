import 'jest-extended'

import Room from './Room'
import User from './User'

describe('Room model', () => {
  describe('#name', () => {
    const room = new Room({ name: 'name', owner: {} as User })

    it('can be changed', () => {
      expect(room.name).toBe('name')
      room.name = 'new name'
      expect(room.name).toBe('new name')
    })
  })

  describe('#owner', () => {
    const ownerMock = { id: '1' } as User
    const room = new Room({ name: 'name', owner: ownerMock })

    it('returns given user', () => {
      expect(room.owner).toBe(ownerMock)
    })
  })

  describe('#users', () => {
    const ownerMock = { id: '1' } as User
    const room = new Room({ name: 'name', owner: ownerMock })

    describe('without users', () => {
      it('does not return owner', () => {
        expect(room.users.length).toBe(0)
      })
    })

    describe('with single additional user', () => {
      beforeEach(() => {
        room.users.push({ id: '2' } as User)
      })

      it('does not return owner', () => {
        expect(room.users.length).toBe(1)
        expect(room.users).toContainEqual({ id: '2' })
      })
    })
  })

  describe('#allUsers', () => {
    const ownerMock = { id: '1' } as User
    const room = new Room({ name: 'name', owner: ownerMock })

    describe('without users', () => {
      it('does not return owner', () => {
        expect(room.allUsers.length).toBe(1)
      })
    })

    describe('with single additional user', () => {
      beforeEach(() => {
        room.users.push({ id: '2' } as User)
      })

      it('does not return owner', () => {
        expect(room.allUsers.length).toBe(2)
        expect(room.allUsers).toIncludeAllMembers([{ id: '1' }, { id: '2' }])
      })
    })
  })
})
