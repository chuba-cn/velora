/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */

interface AsyncIterable<T> {
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

class UserLoader implements AsyncIterable<string> {
  private users = ["Bob", "Alice", "Eva"];

  [Symbol.asyncIterator](): AsyncIterator<string> {
    return {
      next: async () => {
        const value = this.users.shift();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return {
          value: value ?? "",
          done: value === undefined,
        };
      },
    };
  }
}

async function loadUsers() {
  const userLoader = new UserLoader();
  for await (const user of userLoader) {
    console.log(`Loaded user: ${user}`);
  }
}

function* numGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

async function* delayedNumGenerator() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  yield 1;

  await new Promise((resolve) => setTimeout(resolve, 1000));
  yield 2;

  await new Promise((resolve) => setTimeout(resolve, 1000));
  yield 3;
}

async function* createPagedData() {
  let page = 1;
  while (true) {
    const response = await fetch(`https://api.example.com/data?page=${page}`);
    const data = await response.json();

    if (data.items.length === 0) {
      return; // No more data
    }

    yield* data.items; // What does yield* do here?
    page++;
  }
}

async function* processingLogFiles() {
  const logBatches = [
    ["Error: Server Down", "Warning: High CPU"],
    ["Info: Server recovered", "Warning: Memory high"],
  ];

  for (const batches of logBatches) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield* batches;
  }
}

async function analyzeLogs() {
  const errorCount = {
    error: 0,
    warning: 0,
    info: 0,
  };

  const logEntries = processingLogFiles();

  for await (const logEntry of logEntries) {
    if (logEntry.toLowerCase().includes("error")) errorCount.error++;
    if (logEntry.toLowerCase().includes("warning")) errorCount.warning++;
    if (logEntry.toLowerCase().includes("info")) errorCount.info++;
  }
}

// -------------------------------------------------------------------------------------------

async function* fetchUserActivities(userId: string) {
    const pages = [
        { activities: ['login', 'view_profile'], nextPage: 2 },
        { activities: ['edit_settings'], nextPage: 3 },
        { activities: ['logout'], nextPage: null }
    ];

    for (const page of pages) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        yield* page.activities;
        
        if (!page.nextPage) break;
    }
}

async function* enrichActivities(activities: AsyncGenerator<string>) {
    for await (const activity of activities) {
        const timestamp = new Date().toISOString();
        yield `${activity} at ${timestamp}`;
    }
}

// How would you compose these two generators to create a new generator 
// that yields timestamped user activities?

async function* getEnrichedAvtivities() {
  const userActivities = fetchUserActivities("abd");

  const enrichedUserAvtivity = enrichActivities(userActivities)

  for await (const eAUser of enrichedUserAvtivity) {
    yield eAUser
  }
}

//2. The output would be
// login at 2024-12-26T12:00:01.000Z
// view_profile at 2024-12-26T12:00:02.000Z
// edit_settings at 2024-12-26T12:00:03.000Z
// logout at 2024-12-26T12:00:04.000Z

const range = {
  from: 1,
  to: 5,
  [ Symbol.iterator ]() {
    return {
      current: this.from,
      last: this.to,
    
    next(){
      if (this.current <= this.last) {
        return {value: this.current++, done: false}
      } else {
        return {done: true}
      }
    }
    }
  }
}

// To make any object iterable, we need to add a method to that object named Symbol.iterator.
// This method returns an iterator object that muts contain a next method which dictates the iteration implementation
// The result of next() must have the form of {done: boolean, value: any}
// When done is true, it means the loop is finished, otherwise value is the next value.

// We can use an iterator of any iterable explicitly:
const str = "Hello";

const iterator = str[ Symbol.iterator ]();

while (true) {
  const result = iterator.next();
  if (result.done) {
    break;
  }
  alert(result.value)
}

const arrayLike = {
  0: "Hello",
  1: "World",
  length: 2
}

const arr = Array.from(arrayLike, (v) => `Log: ${v}`)

for (const i of arr) {
  console.log(i)
}

/**
 * 
 * GENERATOR FUNCTIONS
 * 
 * Generator functions behave differently from normal ones. When such function is called, it does not run it's code.
 * Insted it returns a special object, called "generator object" to manage the execution. This generator object implements the 
 * Symbol.iterator protocol which means that it is iterable and can be used in a for of loop
 * 
 */
function* generateSequence() {
  yield 1;
  yield 2;
  return 3;
}

// const gen = generateSequence()
// const i = gen.next();
// const val = i.value;

// USING GENERATORS FOR ITERABLES 
const range1 = {
  from: 0,
  to: 5,
  *[ Symbol.iterator ]() {
    for (let val = this.from; this.from <= this.to; this.from++){
      yield val;
    }
  }
}

function* generateSeq2(start: number, end: number) {
  for (let i = start; i <= end; i++){
    yield i;
  }
}

function* generatePasswordCodes() {
  yield* generateSeq2(48, 57);

  yield* generateSeq2(65, 90);

  yield* generateSeq2(97, 122);
}

let str2 = "";

for (const code of generatePasswordCodes()) {
  str2+= String.fromCharCode(code)
}

function* gen(): Generator<string, void, number> {
  const result = yield "2 + 2 = ?";
  alert(result)
}

const gen2 = gen();

const qstn = gen2.next().value;

gen2.next(4)


function* pseudoRandom(num: number) {
  
  let next = num;

  while (true) {
   next = (next * 16807) % 2147483647;

    yield next;
  }
}

function* testUserGenerator(seed: number) {
  const random = pseudoRandom(seed);

  while (true) {
    const userId = random.next().value!

    yield {
      username: `user_${userId % 1000}`,
      email: `test${userId % 1000}@examle.com`,
      age: (userId % 50) + 18
    }
  }
}

/**
 * ASYNC ITERATORS & GENERATORS
 * 
 * ?  Async Iterators
 * 
 * Async iteration allows for iteration over data that comes asynchronously, on-demand, like, for instance, when we download something chunk-by-chunk
 * over a network. Async generators make it even more covenient to work with async iterators.
 * 
 * Asynchronous iteration is needed when values come in an async manner, like after setTimeout or another kind of delay.
 * The most common case is that the object needs to make a network reques to deliver the next value.
 * 
 * To make an object iterable asynchronously:
 * 
 * 1. Use/implement Symbol.AsyncIterator instead of Symbol.Iterator method on the object to be made asynchronoulsy iterable
 * 2. The next() method should return a promise (to be fulfilled with the next value).
 *      *The async keyword handles it, we can sympley make async next();
 * 3. To iterate over such an object, we should use a for await(let item of iterable) loop.
 *      * Note the await keyword
 * 
 * !!Note: Features that require regular sync iterators, don't work with async ones. For instance a spread syntax won't work
 */

//Async Range Iterbale object

const range2 = {
  from: 1,
  to: 5,
  [ Symbol.asyncIterator ]() {
    return {
      current: this.from,
      last: this.to,
      // async next(): Promise<IteratorResult<number>> {
      //   return await new Promise((resolve) => setTimeout(() => {
      //     this.current <= this.last
      //       ? resolve({ value: this.current++, done: false })
      //       : resolve({ done: true, value: undefined });
      //   },1000));
      // }
      async next() {
        // (2)

        // note: we can use "await" inside the async next:
        await new Promise((resolve) => setTimeout(resolve, 1000)); // (3)

        if (this.current <= this.last) {
          return { done: false, value: this.current++ };
        } else {
          return { done: true };
        }
      },
    };
  }
}


// * ASYNC GENERATORS

async function* genSeq(start: number, end: number) {
  
  for (let i = start; i <= end; i++){

    await new Promise(resolve => setTimeout(resolve, 1000));

    yield i;
  }
}


void (async () => {
  const generator = genSeq(1, 5);
  for await (const value of generator) {
    alert(value); // 1, then 2, then 3, then 4, then 5 (with delay between)
  }
})();


async function* fetchCommits(repo: string) {
  let url = `https://api.github.com/repos/${repo}/commits`;

  while (url) {
    const response = await fetch(url, {
      headers: { "User-Agent": "Our Script" },
    });

    const data = await response.json()

    const nextPage = response?.headers?.get("Link")?.match(/<(.*?)>; rel="next"/);
    url = nextPage?.[ 1 ] ?? '';

    for (const d of data) {
      yield d;
    }
  }

}

void (async () => {
  for await (const val of fetchCommits("repo")) {
    console.log(val);
  }
})();
