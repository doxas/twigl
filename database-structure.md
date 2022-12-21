# Database Structure

twigl uses [Firebase Realtime Database](https://firebase.google.com/products/realtime-database?hl=ja) to manage data of the broadcast mode.

## `director`

`director` is an object from director ID to `Director`.

`Director` is like a user per a session.
`Director` has an information of the director.

```ts
interface Director {
    /**
     * The screen name of the director.
     */
    name: string;
};
```

## `channel`

`channel` is an object from channel ID to `Channel`.

`Channel` has code, cursor position, and stuff for the channel.

It also has three director IDs:

- director ID for the screen name and the session URL
- director ID represents the graphics coder (VJ)
- director ID represents the sound coder (DJ)

```ts
/**
 * Mode of the regulation in the graphics code.
 */
enum GraphicsMode {
    Classic = 0,
    Geek = 1,
    Geeker = 2,
    Geekest = 3,
    Classic300 = 4,
    Geek300 = 5,
    Geeker300 = 6,
    Geekest300 = 7,
    ClassicMRT = 8,
    GeekMRT = 9,
    GeekerMRT = 10,
    GeekestMRT = 11,
}

interface Channel {
    /**
     * The director ID for the Channel.
     */
    directorId: string;

    /**
     * The director ID of the graphics coder (VJ).
     * It can be `'unknown'` if the coder is not there.
     */
    visual: string;

    /**
     * The director ID of the sound coder (DJ).
     * It can be `'unknown'` if the coder is not there.
     */
    disc: string;

    /**
     * Always `true` ?
     */
    initialized: boolean;

    graphics: {
        /**
         * Represents the current cursor position.
         * row, column, and scrollTop.
         * They are represented in the format like `'10|22|2'`.
         */
        cursor: string;

        /**
         * The current graphics mode (regulation)
         */
        mode: GraphicsMode;

        /**
         * The GLSL code of the graphics.
         */
        source: string;
    };

    sound: {
        /**
         * Represents the current cursor position.
         * row, column, and scrollTop.
         * They are represented in the format like `'10|22|2'`.
         */
        cursor: string;

        /**
         * The counter which increments when the coder hit the play button.
         */
        mode: GraphicsMode;

        /**
         * The GLSL code of the sound.
         */
        source: string;
    }
}
```

## `viewer`

`viewer` is an object from channel ID to `Viewer`.

`Viewer` has an information about viewers of the channel.

```ts
interface Viewer {
    /**
     * The counter represents the current viewer.
     */
    count: number;
}
```

## `star`

`star` is an object from channel ID to `Star`.

`Star` has information about reactions (♥) to the channel.

```ts
interface Star {
    /**
     * The counter represents the current reaction count (♥).
     */
    count: number;
}
```
