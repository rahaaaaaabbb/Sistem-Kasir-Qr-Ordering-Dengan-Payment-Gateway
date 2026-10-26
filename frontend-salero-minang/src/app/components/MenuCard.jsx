import Image from 'next/image';

export default function MenuCard({ id, name, category, price, stock, image, onAddToCart }) {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const isOutOfStock = stock <= 0;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative transition-transform ${isOutOfStock ? 'opacity-75 grayscale-[50%]' : 'hover:scale-[1.02] active:scale-95'}`}>
      
      {/* Label Stok Habis */}
      {isOutOfStock && (
        <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white text-[10px] font-black uppercase text-center py-1 z-10 backdrop-blur-sm">
          Stok Habis
        </div>
      )}

      {/* Bagian Gambar */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img 
          src={image ? image : "/placeholder-food.jpg"} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "/placeholder-food.jpg"; 
          }}
        />
        
        {/* Label Kategori */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[9px] font-bold px-2 py-1 rounded text-gray-700 uppercase tracking-wider">
          {category}
        </div>
      </div>

      {/* Bagian Informasi & Tombol */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-gray-800 leading-tight mb-1 line-clamp-2">{name}</h3>
        <p className="text-xs text-gray-400 font-medium mb-3 mt-auto">Sisa: {stock} porsi</p>
        
        <div className="flex flex-col gap-2 mt-auto">
          <span className="text-orange-600 font-black text-sm">
            {formatRupiah(price)}
          </span>
          <button 
  onClick={() => onAddToCart(id, name, price, stock)}
  disabled={isOutOfStock}
  className={`w-full font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors
    ${isOutOfStock 
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
      : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100'}`}
>
  {isOutOfStock ? 'Habis' : '+ Tambah'}
</button>
        </div>
      </div>
    </div>
  );
}