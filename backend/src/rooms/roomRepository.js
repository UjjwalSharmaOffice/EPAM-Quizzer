export default class RoomRepository {
  constructor() {
    this.rooms = new Map();
    this.userRooms = new Map();
  }

  add(room) {
    this.rooms.set(room.id, room);
  }

  get(roomId) {
    return this.rooms.get(roomId) || null;
  }

  remove(roomId) {
    const room = this.rooms.get(roomId) || null;
    if (room) this.rooms.delete(roomId);
    return room;
  }

  list() {
    return Array.from(this.rooms.values());
  }

  mapUser(userId, roomId) {
    this.userRooms.set(userId, roomId);
  }

  getRoomIdByUser(userId) {
    return this.userRooms.get(userId) || null;
  }

  clearUser(userId) {
    this.userRooms.delete(userId);
  }

  clearMappingsForRoom(room) {
    if (room.host) this.userRooms.delete(room.host.id);
    room.participants.forEach((p) => this.userRooms.delete(p.id));
  }
}
