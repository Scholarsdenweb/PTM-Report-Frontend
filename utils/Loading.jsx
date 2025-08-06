import spinner from "../src/assets/spinner.png";

const Loading = () => {
  return (
    <div className="absolute top-0 left-0 bottom-0 right-0 backdrop-blur-xs">
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin rounded-full">
          <img src={spinner} alt="" />
        </div>
      </div>
    </div>
  );
};

export default Loading;
