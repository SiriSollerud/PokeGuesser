import "./App.css";
import { useEffect } from "react";
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
      draft.pokeCollection.push(action.value);
      return;

    default:
      break;
  }

  function generateQuestion() {
    const tempRandom = draft.pokeCollection[Math.floor(Math.random()*draft.pokeCollection.length)];
    return { randmPokemon: "", pokeImg: "", answerName: "" };
  }
}

const initialState = {
  points: 0,
  strikes: 0,
  timeRemaining: 0,
  highScore: 0,
  pokeCollection: [],
  currentQuestion: null,
  playing: false,
  fetchCount: 0,
};

function App() {
  const [state, dispatch] = useImmerReducer(myReducer, initialState);

  let pokeMax = [151];
  //let pokemons = []
  for (let i = 1; i <= 151; i++) {
    pokeMax.push(i);
  }

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

  return (
    <div>
      <p className="text center fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center">
        <button
          onClick={() => dispatch({ type: "startPlaying" })}
          className="text-white bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-3 rounded text-2xl font-bold"
        >
          Play PokeGuess
        </button>
      </p>
      {/* <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" className="object-scale-down h-96 w-96 brightness-0"></img> */}
    </div>
  );
}

export default App;
