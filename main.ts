import { parse } from "https://deno.land/std@0.201.0/flags/mod.ts"
import * as fs from "https://deno.land/std@0.201.0/fs/mod.ts"
import * as path from "https://deno.land/std@0.201.0/path/mod.ts"

const { dest: destRaw, exclude: excludeRaw, check } = parse(Deno.args, {
  string: ["dest"],
  boolean: ["check"],
  default: { dest: "target/star.ts" },
  collect: ["exclude"],
  alias: {
    d: "dest",
    e: "exclude",
    c: "check",
  },
})

const dest = path.join(Deno.cwd(), destRaw)
const destDir = path.dirname(dest)

let generated = ""
for await (
  const entry of fs.walk(".", {
    match: [/\.ts$/],
    skip: [destRaw, ...((excludeRaw ?? []) as string[])].map((g) => path.globToRegExp(g)),
  })
) {
  generated += `import ${JSON.stringify(path.relative(destDir, entry.path))}\n`
}

await fs.ensureDir(destDir)
await Deno.writeTextFile(dest, generated)

if (check) {
  new Deno.Command("deno", {
    args: ["cache", dest, "--check"],
    stderr: "inherit",
    stdout: "inherit",
  }).spawn()
}
