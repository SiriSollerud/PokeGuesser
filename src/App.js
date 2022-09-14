import "./App.css";
import { useEffect, useState } from "react";
import { useImmerReducer } from "use-immer";

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
      draft.nameCollection.push(action.value[0]);
      draft.imgCollection.push(action.value[1]);
      return;
    case "guessAttempt":
      console.log(draft.currentQuestion.pokeName);
      if (action.value === draft.currentQuestion.pokeName) {
        draft.points++;
        console.log("CORRECT");
        //TODO: reveal image
        draft.answeredCorrectly = true;
        draft.currentQuestion = generateQuestion();
      } else {
        draft.strikes++;
        console.log("WRONG");
      }
      return;

    default:
      break;
  }

  function generateQuestion() {
    //maybde att 41:12
    const min = 0;
    const max = draft.nameCollection.length;
    const randmNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    const imgHidden = draft.imgCollection[randmNumber];
    const answer = draft.nameCollection[randmNumber];
    const imgRevealed = draft.imgCollection[randmNumber];

    return { pokeImgQ: imgHidden, pokeName: answer, imgRevealed };
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

  //TODO: fix when backspaced??
  let requests = pokeMax.map((pokeMax) =>
    fetch(`https://pokeapi.co/api/v2/pokemon/${pokeMax}`)
  );

  useEffect(() => {
    const requestController = new AbortController();

    async function go() {
      try {
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
                value: [pokemon.name, pokemon.sprites.other.home.front_default],
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
  }, []);

  const [guess, setGuess] = useState("");

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      console.log(`guess: ${guess}`);
      dispatch({ type: "guessAttempt", value: guess });
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
            >
              {/* {console.log(state.currentQuestion.pokeName)} */}
            </div>
          </div>
          <div className="flex justify-center py-5">
            <div className="mb-3 xl:w-96">
              <input
                type="search"
                className="form-control block w-full px-3 py-1.5 text-lg font-sans text-gray-400 bg-neutral-800 bg-clip-padding border-2 border-solid border-neutral-700 rounded-lg 
                transition ease-in-out m-0 dark:text-white focus:border-blue-600 focus:outline-none
                "
                placeholder="Who's that Pokemon?"
                onKeyDown={handleKeyDown}
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
          </p>
        )}

      {/* <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" className="object-scale-down h-96 w-96 brightness-0"></img> */}
    </div>
  );
}

export default App;
