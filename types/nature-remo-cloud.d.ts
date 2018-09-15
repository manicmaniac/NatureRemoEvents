declare module NatureRemoGlobal {
  export interface Device {
    id: string,
    name: string,
    temparature_offset: number,
    humidity_offset: number,
    created_at: string,
    updated_at: string,
    firmware_version: string,
    newest_events: NewestEvents
  }
  export interface NewestEvents {
    te: Event,
    hu: Event,
    il: Event,
  }
  export interface Event {
    val: number,
    created_at: string
  }
}
