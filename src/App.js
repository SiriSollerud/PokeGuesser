import "./App.css";
import { useEffect, useState } from "react";
import { useImmerReducer } from "use-immer";

let strictReactCount = 0;

function myReducer(draft, action) {
  switch (action.type) {
    case "startPlaying":
      draft.timeRemaining = 30;
      draft.points = 0;
      draft.strikes = 0;
      draft.playing = true;
      draft.currentQuestion = generateQuestion();
      return;
    case "addToCollection":
      // TODO: adding  to do do
      console.log("Adding to collection");
      draft.nameCollection.push(action.value[0]);
      draft.imgCollection.push(action.value[1]);
      return;
    case "guessAttempt":
      console.log(draft.currentQuestion.pokeName);
      //fixing issue with poekapi giving nidoran-m and nidoran-f
      if (draft.currentQuestion.pokeName.includes("nidoran")) {
        draft.currentQuestion.pokeName = "nidoran";
      }
      if (action.value.toLowerCase() === draft.currentQuestion.pokeName) {
        draft.points++;
        //TODO: reveal image
        draft.answeredCorrectly = true;
        draft.currentQuestion = generateQuestion();
      } else {
        draft.strikes++;
        //console.log("WRONG");
      }
      return;

    default:
      break;
  }

  function generateQuestion() {
    let count = 1;
    console.log(`Question ${count}`);
    count++;
    draft.answeredCorrectly = false;
    const min = 0;
    const max = draft.nameCollection.length;
    const randmNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    // Splice so that I can remove img from collection and not be asked twice
    const randomImg = draft.imgCollection.splice(randmNumber, 1)[0];
    const answer = draft.nameCollection.splice(randmNumber, 1)[0];

    console.log(`Collection length: ${draft.nameCollection.length}`);

    return { pokeImgQ: randomImg, pokeName: answer };
  }
}

const initialState = {
  points: 0,
  strikes: 0,
  timeRemaining: 0,
  highScore: 0,
  imgCollection: [],
  nameCollection: [],
  currentQuestion: null,
  playing: false,
  answeredCorrectly: false,
  fetchCount: 0,
};

function App() {
  const [state, dispatch] = useImmerReducer(myReducer, initialState);

  let pokeMax = [];
  //let pokemons = []
  for (let i = 1; i <= 151; i++) {
    pokeMax.push(i);
  }

  useEffect(() => {
    // TODO: must be a better way than this crude strictReactCount bullshit I made up
    if (strictReactCount > 0) {
      const requestController = new AbortController();

      async function go() {
        try {
          // requests used to be outside useEffect, putting it in here
          // fixed the promise error - wonder why?
          let requests = pokeMax.map((pokeMax) =>
            fetch(`https://pokeapi.co/api/v2/pokemon/${pokeMax}`)
          );
          Promise.all(requests)
            .then((responses) => {
              return responses;
            })
            // map array of responses into an array of response.json() to read their content
            .then((responses) => Promise.all(responses.map((r) => r.json())))
            // all JSON answers are parsed: "pokemons" is the array of them
            .then((pokemons) =>
              pokemons.forEach((pokemon) =>
                dispatch({
                  type: "addToCollection",
                  value: [
                    pokemon.name,
                    pokemon.sprites.other.home.front_default,
                  ],
                })
              )
            );
        } catch (error) {
          console.log(error);
        }
      }
      go();

      return () => {
        requestController.abort();
      };
    }
    strictReactCount++;
  }, []);

  const [guess, setGuess] = useState("");

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      console.log(`guess: ${guess}`);
      dispatch({ type: "guessAttempt", value: guess });
      setGuess("");
    }
  };

  return (
    <div>
      {state.currentQuestion && (
        // learned to center a div :D
        <div>
          <div className="center-screen">
            <div
              className="object-none content-center h-96 w-96 bg-cover bg-center brightness-0"
              style={{
                backgroundImage: `url(${state.currentQuestion.pokeImgQ})`,
              }}
            ></div>
          </div>
          {/* TODO: add skip button? */}
          <div className="flex justify-center py-5">
            <div className="mb-3 xl:w-96">
              <input
                type="search"
                className="form-control block w-full px-3 py-1.5 text-lg font-sans text-gray-400 bg-neutral-800 bg-clip-padding border-2 border-solid border-neutral-700 rounded-lg 
                transition ease-in-out m-0 dark:text-white focus:border-blue-600 focus:outline-none
                "
                placeholder="Who's that Pokemon?"
                onKeyDown={handleKeyDown}
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      {state.playing == false &&
        Boolean(state.imgCollection.length) &&
        !state.currentQuestion && (
          <p className="text center fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center">
            <button
              onClick={() => dispatch({ type: "startPlaying" })}
              className="text-white bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-3 rounded text-2xl font-bold"
            >
              Play PokeGuess
            </button>
            {console.log("started!")}
          </p>
        )}
    </div>
  );
}

export default App;
