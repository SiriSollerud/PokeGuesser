import "./App.css";
import { useEffect, useState } from "react";
import { useImmerReducer } from "use-immer";

let strictReactCount = 0;

// use this to have pokemon answer image reveal for 3 seconds?
function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

function myReducer(draft, action) {
  switch (action.type) {
    case "sendHighScore":
      draft.highScore = action.value
      if (!action.value) draft.highScore = 0
      return
    case "startPlaying":
      draft.points = 0;
      draft.strikes = 0;
      draft.playing = true;
      draft.currentQuestion = generateQuestion();
      return;
    case "addToCollection":
      console.log("Adding to collection");
      draft.nameCollection.push(action.value[0]);
      draft.imgCollection.push(action.value[1]);
      return;
    case "guessAttempt":
      console.log(draft.currentQuestion.pokeName);
      if (!draft.playing) return;

      //fixing issue with poekapi giving nidoran-m and nidoran-f
      if (draft.currentQuestion.pokeName.includes("nidoran")) {
        draft.currentQuestion.pokeName = "nidoran";
      }

      // TODO: no more guesses if you've guessed them all - congrats screen?
      if (action.value.toLowerCase() === draft.currentQuestion.pokeName) {
        draft.points++;
        if (draft.points > draft.highScore) draft.highScore = draft.points;
        //TODO: reveal image
        //document.getElementById("pokeImg").className = "object-none content-center h-96 w-96 bg-cover bg-center brightness-100"
        draft.answeredCorrectly = true;
        //wait(3000);
        draft.currentQuestion = generateQuestion();
      } else {
        draft.strikes++;
        draft.answeredCorrectly = false;
        if (draft.strikes >= 3) {
          draft.playing = false;
        }
      }
      return;

    default:
      break;
  }

  function generateQuestion() {
    /*     if (document.getElementById("pokeImg") && draft.answeredCorrectly) {
      document.getElementById("pokeImg").className = "object-none content-center h-96 w-96 bg-cover bg-center brightness-100"
    } */

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
  highScore: 0,
  imgCollection: [],
  nameCollection: [],
  currentQuestion: null,
  playing: false,
  answeredCorrectly: false,
  fetchCount: 0,
};

// TODO: add feature if guess ALL pokemons?
function HeartIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      fill="currentColor"
      className={props.className}
      viewBox="0 0 16 16"
    >
      <path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z" />
    </svg>
  );
}

// TODO: this doesn't really help. It loads twice on start then it aborts after that... So...
async function fetchPokemons(pokeMax, dispatch) {
  try {
    // requests used to be outside useEffect, putting it in here fixed the promise error - wonder why?
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
            value: [pokemon.name, pokemon.sprites.other.home.front_default],
          })
        )
      );
  } catch (error) {
    console.log(error);
  }
}

function App() {
  const [state, dispatch] = useImmerReducer(myReducer, initialState);

  let pokeMax = [];
  for (let i = 1; i <= 151; i++) {
    pokeMax.push(i);
  }

  useEffect(() => {
    dispatch({
      type: "sendHighScore",
      value: localStorage.getItem("highscore"),
    });
  }, []);

  useEffect(() => {
    if (state.highScore > 0) {
      localStorage.setItem("highscore", state.highScore);
    }
  }, [state.highScore]);

  useEffect(() => {
    // TODO: must be a better way than this crude strictReactCount bs I made up
    if (strictReactCount == 1) {
      const requestController = new AbortController();

      fetchPokemons(pokeMax, dispatch);

      return () => {
        console.log("aborting");
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
      /*  if (state.answeredCorrectly) {
        dispatch({ type: "nextQuestion"});
      } */
      setGuess("");
    }
  };

  return (
    <div>
      {state.currentQuestion && (
        <>
          <p className="text-center py-9">
            {/* heart logic */}
            {[...Array(3 - state.strikes)].map((item, index) => {
              return (
                <HeartIcon key={index} className="inline text-red-800 mx-3" />
              );
            })}
            {[...Array(state.strikes)].map((item, index) => {
              return (
                <HeartIcon key={index} className="inline text-gray-500 mx-3" />
              );
            })}
          </p>
          <div className="center-screen">
            <div
              id="pokeImg"
              className="object-none content-center h-96 w-96 bg-cover bg-center brightness-0"
              style={{
                backgroundImage: `url(${state.currentQuestion.pokeImgQ})`,
              }}
            ></div>
          </div>
          {/* TODO: add skip button? */}
          <div className="flex justify-center">
            <div className="mb-3 xl:w-96 py-3">
              <input
                type="search"
                className="form-control block w-full px-3 py-1.5 text-lg font-sans text-gray-400 bg-neutral-800 bg-clip-padding border-2 border-solid border-neutral-700 rounded-lg 
                transition ease-in-out m-0 dark:text-gray-200 focus:border-blue-600 focus:outline-none
                "
                placeholder="Who's that Pokemon?"
                onKeyDown={handleKeyDown}
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
              />
            </div>
          </div>
        </>
      )}
      {state.playing == false &&
        Boolean(state.imgCollection.length) &&
        !state.currentQuestion &&
        dispatch({ type: "startPlaying" })}

      {state.strikes >= 3 && state.currentQuestion && (
        <div className="fixed top-0 left-0 bottom-0 right-0 bg-black/70 text-white flex justify-center items-center text-center">
          <div>
            <p className="text-6xl mb-4 font-bold">GAME OVER</p>
            <p>
              SCORE:{" "}
              <span className="text-amber-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="inline-block relative bottom-1 mx-1"
                  viewBox="0 0 16 16"
                >
                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                </svg>
                <span style={{fontWeight: 'bold'}}>{state.points}</span>
              </span>
            </p>

            <p className="mb-5">HIGH SCORE: <span style={{fontWeight: 'bold'}}>{state.highScore}</span></p>

            {/* TODO: if collection is 140/151 at end of turn, next turn will just be 140 as well --> fetch again? */}
            <button onClick={() => dispatch({ type: "startPlaying" })} className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800">
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                Play Again
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
