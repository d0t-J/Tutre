export default function CategoryFormFields({
  type,
  name,
  setName,
  chapterNo,
  setChapterNo,
  isPending
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">
          {type} Name <span className="text-red-500">*</span>
        </label>
        <input 
          type="text"
          placeholder={`e.g. ${type === 'Class' ? 'Grade 10' : type === 'Subject' ? 'Physics' : 'Kinematics'}`}
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all disabled:opacity-50 disabled:bg-slate-100"
          autoFocus
        />
      </div>

      {type === 'Chapter' && (
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-sm font-bold text-slate-700">
            Chapter Number
          </label>
          <input 
            type="number"
            placeholder="e.g. 1"
            value={chapterNo}
            min={0}
            onChange={(e) => setChapterNo(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all disabled:opacity-50 disabled:bg-slate-100"
          />
        </div>
      )}
    </>
  );
}
