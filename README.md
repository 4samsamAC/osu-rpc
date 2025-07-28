<div style="text-align: center;"><img src="https://imgur.com/6Kw4l8t.png" alt="image"></div>

## How to install

1. Install [tosu](https://github.com/tosuapp/tosu/releases/latest) <br>

2. Go to the [latest release](https://github.com/4samsamAC/osu-rpc/releases/latest), download **osu!rpc.exe** and the **config.json** put them in the same file.

3. Once [tosu](https://github.com/tosuapp/tosu/releases/latest) installed, Copy&Past the path to `tosu.exe` in the `path` variable in **config.json**, then open [osu!](https://osu.ppy.sh)

4. Start **osu!rpc.exe**

5. Disable this option in the osu! settings:<br>
![image](https://imgur.com/uJADb8F.png)

## Building

You must have [bun](bun.sh)

```
$ git clone https://github.com/4samsamAC/osu-rpc
$ cd osu-rpc
$ bun run build
$ cd dist
```

Have Fun!

## Screenshots

In menu:<br>
![image](https://imgur.com/WP1WJNY.png)

In game:<br>
![image](https://imgur.com/RCY3Ril.png)

Currently only work for Windows x64
