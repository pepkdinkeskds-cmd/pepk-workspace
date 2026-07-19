# Settings CSV Header Fix v0.7.2

Akar masalah: endpoint Google Visualization menebak jumlah baris header ketika parameter `headers` tidak diberikan. Pada sheet Settings, beberapa baris awal digabung menjadi label kolom sehingga parser frontend tidak memperoleh header `key,value`.

Perbaikan: seluruh URL CSV memakai `headers=1`.
