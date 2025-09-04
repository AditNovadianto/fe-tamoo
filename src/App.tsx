import { useState, useRef } from "react";

const App = () => {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // durasi rekaman (detik)
  const timerRef = useRef<number | null>(null);

  const [audioURL, setAudioURL] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [datas, setDatas] = useState<{ name: string; address: string; url: string }[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioURL(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    setRecording(true);

    // Reset & mulai timer
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);

    // Hentikan timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const submitHandler = () => {
    if (!name || !address || !audioURL) {
      alert("Please fill all fields and record audio.");
      return;
    }

    const newData = { name, address, url: audioURL };
    setDatas([...datas, newData]);

    // Reset fields
    setName("");
    setAddress("");
    setAudioURL("");
    setRecordingTime(0);
  };

  // Format waktu rekaman ke mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  console.log(datas);

  return (
    <div className="p-4">
      <div className="w-[50%] mx-auto flex flex-col gap-5 bg-blue-200 p-5 rounded-lg shadow">
        <p className="text-2xl font-bold">Form Data</p>

        <div>
          <p>Nama</p>
          <input
            value={name}
            className="mt-3 px-3 py-2 w-full border-2 border-black rounded-lg"
            type="text"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <p>Alamat</p>
          <input
            value={address}
            className="mt-3 px-3 py-2 w-full border-2 border-black rounded-lg"
            type="text"
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <p>Rekaman Audio</p>

          <button
            onClick={recording ? stopRecording : startRecording}
            className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded"
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </button>

          {/* Timer */}
          {recording && (
            <p className="text-red-600 font-semibold">
              Recording... {formatTime(recordingTime)}
            </p>
          )}

          {/* Preview setelah stop */}
          {!recording && audioURL && (
            <div className="mt-3">
              <p className="font-semibold">Preview Rekaman:</p>
              <audio controls className="w-full mt-2">
                <source src={audioURL} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        <button
          onClick={submitHandler}
          className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer"
        >
          Submit
        </button>
      </div>

      {datas.length > 0 && (
        <div className="w-[50%] mx-auto mt-10">
          <h2 className="text-2xl font-bold mb-5">Submitted Data</h2>

          <ul className="flex flex-col gap-5">
            {datas.map((data, index) => (
              <li key={index} className="bg-gray-100 p-4 rounded-lg shadow">
                <p>
                  <strong>Nama:</strong> {data.name}
                </p>
                <p>
                  <strong>Alamat:</strong> {data.address}
                </p>
                <audio controls className="mt-3 w-full">
                  <source src={data.url} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
