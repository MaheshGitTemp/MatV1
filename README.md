# Live_PowerBI
Production live

docker node:
PS Z:\LIVE\HostingerLIVE\Live_PowerBI> docker build -t wedsmutual-backend ./backend
-----------------------
PS Z:\LIVE\HostingerLIVE\Live_PowerBI> docker run -p 9012:9012 wedsmutual-backend //random name in docker desk dockername
OR
docker run --name my-backend -p 9012:9012 wedsmutual-backend   // defined name in docker desk for container
-------------------------------
